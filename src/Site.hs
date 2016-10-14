{-# LANGUAGE OverloadedStrings, ScopedTypeVariables #-}

------------------------------------------------------------------------------
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
import           Control.Error.Safe (tryJust)
import           Control.Lens hiding ((.=))
import           Data.Aeson hiding (json)
import           Data.Bifunctor (first)
import           Data.ByteString (ByteString)
import qualified Data.Map as M
import qualified Data.Text as T
import qualified Data.Text.Encoding as T
import qualified Data.Text.Read as T
import           Snap.Core
import           Snap.Snaplet
import qualified Snap.Snaplet.SqliteJwt as J
import           Snap.Snaplet.SqliteSimple
import           Snap.Util.FileServe
import qualified Web.JWT as JWT
------------------------------------------------------------------------------
import           Application
import qualified Db
import           Util

type H = Handler App App

data LoginParams = LoginParams {
    lpLogin :: T.Text
  , lpPass  :: T.Text
  }

instance FromJSON LoginParams where
  parseJSON (Object v) = LoginParams <$>
                         v .: "login" <*>
                         v .: "pass"
  parseJSON _          = mzero

data PostTodoParams = PostTodoParams {
    ptText :: T.Text
  }

instance FromJSON PostTodoParams where
  parseJSON (Object v) = PostTodoParams <$> v .: "text"
  parseJSON _          = mzero

instance ToJSON Db.Todo where
  toJSON c = object [ "id"        .= Db.todoId c
                    , "savedOn"   .= Db.todoSavedOn c
                    , "completed" .= Db.todoCompleted c
                    , "text"      .= Db.todoText c]

maybeWhen :: Monad m => Maybe a -> (a -> m ()) -> m ()
maybeWhen Nothing _  = return ()
maybeWhen (Just a) f = f a

handleRestTodos :: H ()
handleRestTodos = (method GET listTodos) <|> (method POST addTodo)
  where
    listTodos :: H ()
    listTodos =
      with jwt $ J.requireAuth query
      where
        query (J.User uid _) = do
          comments <- withTop db $ Db.listTodos (Db.UserId uid)
          writeJSON comments
    addTodo = do
      parms <- reqJSON
      with jwt $ J.requireAuth (query (ptText parms))
      where
        query text (J.User uid _) = do
          todo <- withTop db $ Db.saveTodo (Db.UserId uid) text
          writeJSON todo

handleNewUser :: H ()
handleNewUser = method POST newUser
  where
    newUser = runHttpErrorExceptT $ do
      login <- lift reqJSON
      user  <- lift $ with jwt $ J.createUser (lpLogin login) (lpPass login)
      u <- hoistHttpError (first show user)
      jwt <- lift $ with jwt $ J.jwtFromUser u
      return $ writeJSON $ object [ "token" .= jwt ]

handleLogin :: H ()
handleLogin = method POST go
  where
    go = runHttpErrorExceptT $ do
      login <- lift reqJSON
      user  <- lift $ with jwt $ J.loginUser (lpLogin login) (lpPass login)
      u <- hoistHttpError (first show user)
      jwt <- lift $ with jwt $ J.jwtFromUser u
      return $ writeJSON $ object [ "token" .= jwt ]

-- | The application's routes.
routes :: [(ByteString, Handler App App ())]
routes = [
           ("/api/login/new",  handleNewUser)
         , ("/api/login",      handleLogin)
         , ("/api/todo",       handleRestTodos)
         , ("/static",         serveDirectory "static")
         , ("/",               serveFile "static/index.html")
         ]

-- | The application initializer.
app :: SnapletInit App App
app = makeSnaplet "app" "An snaplet example application." Nothing $ do
    addRoutes routes
    -- Initialize auth that's backed by an sqlite database
    d <- nestSnaplet "db" db sqliteInit

    -- Initialize auth that's backed by an sqlite database
    jwt <- nestSnaplet "jwt" jwt (J.sqliteJwtInit d)

    -- Grab the DB connection pool from the sqlite snaplet and call
    -- into the Model to create all the DB tables if necessary.
    let c = sqliteConn $ d ^# snapletValue
    liftIO $ withMVar c $ \conn -> Db.createTables conn
    return $ App d jwt
