{-# LANGUAGE OverloadedStrings, ScopedTypeVariables, DeriveGeneric, RecordWildCards #-}

-----------------------------------------------------------------------------
-- | This module is where all the routes and handlers are defined for your
-- site. The 'app' function is the initializer that combines everything
-- together and is exported by this module.
module Site
  ( app
  ) where

------------------------------------------------------------------------------
import           Control.Concurrent
import           Control.Applicative
import           Control.Monad.Except
import           Control.Lens hiding ((.=))
import           Data.Aeson hiding (json)
import           Data.ByteString (ByteString)
import           Snap.Core
import           Snap.Snaplet
import qualified Snap.Snaplet.SqliteSimple.JwtAuth as J
import           Snap.Snaplet.SqliteSimple
import           Snap.Util.FileServe
------------------------------------------------------------------------------
import           Application
import           Util
import           REST
import           Model (User(..), createTables)

type H = Handler App App

replyJson :: ToJSON a => (Model.User -> Handler App J.SqliteJwt (Either ByteString a)) -> H ()
replyJson action = do
  res <- with jwt $ J.requireAuth (\(J.User uid login) -> action (User uid login))
  either (finishEarly 403) writeJSON res

handleRestUserInfo :: H ()
handleRestUserInfo = method GET (replyJson userInfo)
  where
    userInfo (User uid login) = return . Right $ object ["id" .= uid, "login" .= login]

handleUnknownAPI :: H ()
handleUnknownAPI = method GET err <|> method POST err <|> method PUT err
  where
    err = finishEarly 404 "Unknown API endpoint"

apiRoutes :: [(ByteString, Handler App App ())]
apiRoutes = [ ("/api/user",      handleRestUserInfo)
            , ("/rest/weight",   method GET restListWeights <|> method POST restSetWeight <|> method DELETE restClearWeight)
            , ("/rest/note",     method GET restListNotes <|> method POST restAddNote <|> method DELETE restDeleteNote)
            , ("/rest/exercise", method GET restListExerciseTypes <|> method POST restNewExerciseType)
            , ("/rest/workout/exercise", method POST restAddExerciseSet <|> method DELETE restDeleteExerciseSet)
            , ("/rest/workout",  method POST restNewWorkout)
            , ("/rest/workout",  method GET restQueryWorkouts)
            , ("/rest/workout",  method PUT restModifyWorkout)
            , ("/rest/stats/workout", method GET restQueryWorkoutHistory)
             ]

-- | The application's routes.
routes :: [(ByteString, Handler App App ())]
routes = [ ("/api/login/new",  with jwt J.registerUser)
         , ("/api/login",      with jwt J.loginUser)
         ]
         ++ apiRoutes ++
         [ ("/api",            handleUnknownAPI)
         , ("/static",         setCaching True >> serveDirectory "static")
         , ("/",               setCaching False >> serveFile "static/build/index.html")
         ]

-- | The application initializer.
app :: SnapletInit App App
app = makeSnaplet "app" "An snaplet example application." Nothing $ do
    addRoutes routes
    -- Initialize auth that's backed by an sqlite database
    d <- nestSnaplet "db" db sqliteInit

    -- Initialize auth that's backed by an sqlite database
    j <- nestSnaplet "jwt" jwt (J.sqliteJwtInit J.defaults d)

    -- Grab the DB connection pool from the sqlite snaplet and call
    -- into the Model to create all the DB tables if necessary.
    let c = sqliteConn $ d ^# snapletValue
    liftIO $ withMVar c $ \conn -> createTables conn
    return $ App d j
