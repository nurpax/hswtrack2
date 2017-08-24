{-# LANGUAGE OverloadedStrings, ScopedTypeVariables #-}

-- This module defines the JSON interface used for talking with the
-- client.  These types do not directly map to what's in the Model,
-- rather these are more coupled with client app logic.
module REST
  ( AppContext(..)
  , ConfigVal(..)
  , WeightSample(..)
  , restAppContext
  , restLoginError
  , restSetWeight
  , restClearWeight
  , restListWeights
  , restAddNote
  , restDeleteNote
  , restListNotes
  , restListExerciseTypes
  , restNewExerciseType
  , restNewWorkout
  , restModifyWorkout
  , restQueryWorkouts
  , restAddExerciseSet
  , restDeleteExerciseSet
  , restQueryWorkoutHistory
  ) where

------------------------------------------------------------------------------
import           Control.Monad (mzero)
import           Control.Monad.Trans (liftIO)
import           Data.Aeson hiding (json)
import           Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BS8
import qualified Data.Map as M
import qualified Data.Text as T
import           Data.Time
------------------------------------------------------------------------------
import           Snap.Core
import           Snap.Snaplet
import qualified Snap.Snaplet.SqliteSimple.JwtAuth as J
import           Snap.Snaplet.SqliteSimple
import           Application
import           Util
import           Model
------------------------------------------------------------------------------

type H = Handler App App

-- Everything needed for rendering the home/settings page
data AppContext = AppContext {
    acLoggedIn   :: Bool
  , acLoginError :: Maybe T.Text
  , acContext    :: Maybe LoggedInContext
  }

instance ToJSON AppContext where
  toJSON (AppContext loggedIn e ctx) =
    object [ "loggedIn"   .= loggedIn
           , "loginError" .= e
           , "context"    .= ctx
           ]

data LoggedInContext = LoggedInContext {
    _ctxLogin    :: T.Text
  , _ctxWeight   :: Maybe WeightSample
  , _ctxSettings :: M.Map String ConfigVal
  }

instance ToJSON LoggedInContext where
  toJSON (LoggedInContext u w o) =
    object [ "login"   .= u
           , "weight"  .= w
           , "options" .= o
           ]

instance ToJSON ConfigVal where
  toJSON (CVString txt) = String txt
  toJSON (CVDouble flt) = Number (realToFrac flt)

instance ToJSON WeightSample where
  toJSON (WeightSample i d w) =
    object [ "id"     .= i
           , "date"   .= formatTime defaultTimeLocale "%F" d
           , "weight" .= w
           ]

instance ToJSON Note where
  toJSON (Note i t n) =
    object [ "id"   .= i
           , "time" .= t
           , "text" .= n
           ]

instance ToJSON RowId where
  toJSON (RowId i) = Number (fromIntegral i)

-- Temp data type for JSON schema tweaking
data ExerciseSets = ExerciseSets Exercise [ExerciseSet]

instance ToJSON ExerciseSets where
  toJSON (ExerciseSets e es) =
    object [ "name"       .= exerciseName e
           , "id"         .= exerciseId e
           , "type"       .= (exerciseTypeToText . exerciseType $ e)
           , "sets"       .= es
           ]

instance ToJSON Workout where
  toJSON (Workout i u t c p es) =
    object [ "id"        .= i
           , "userId"    .= u
           , "time"      .= t
           , "comment"   .= c
           , "public"    .= p
           , "exercises" .= map (uncurry ExerciseSets) es
           ]

instance ToJSON Exercise where
  toJSON (Exercise i n t) =
    object [ "id"   .= i
           , "name" .= n
           , "type" .= exerciseTypeToText t
           ]

instance ToJSON ExerciseSet where
  toJSON (ExerciseSet i ts reps weight comment) =
    object [ "id"      .= i
           , "time"    .= ts
           , "reps"    .= reps
           , "weight"  .= weight
           , "comment" .= comment
           ]

data WorkoutPutReq = WorkoutPutReq {
    wputWorkoutId :: RowId
  , wputPublic    :: Bool
  }

instance FromJSON WorkoutPutReq where
    parseJSON (Object v) = WorkoutPutReq <$> (RowId <$> v .: "id") <*> v .: "public"
    parseJSON _          = mzero

data UserPutReq = UserPutReq {
    userPutPassword :: T.Text
  }

instance FromJSON UserPutReq where
    parseJSON (Object v) = UserPutReq <$> v .: "password"
    parseJSON _          = mzero

restLoginError :: MonadSnap m => T.Text -> m ()
restLoginError e =
  writeJSON (AppContext False (Just e) Nothing)

replyJson :: ToJSON a => (Model.User -> Handler App J.SqliteJwt (Either ByteString a)) -> H ()
replyJson action = do
  res <- with jwt $ J.requireAuth (\(J.User uid login) -> action (Model.User uid login))
  either (finishEarly 403) writeJSON res

-- FIXME: this doesn't actually support non-logged in status!
anonReplyJson :: ToJSON a => (Maybe Model.User -> Handler App J.SqliteJwt (Either ByteString a)) -> H ()
anonReplyJson action = do
  res <- with jwt $ J.requireAuth (\(J.User uid login) -> action (Just (Model.User uid login)))
  either (finishEarly 403) writeJSON res

-- | Run an IO action with an SQLite connection
withDb :: (Connection -> IO a) -> Handler App J.SqliteJwt a
withDb action =
  withTop db . withSqlite $ \conn -> action conn

-- Get requested date either from GET params or return today's time if not specified.
-- FIXME: at some point we need to decide how to deal with timezones here
getToday :: Handler App J.SqliteJwt UTCTime
getToday = do
  today <- tryGetParam "date"
  case today of
    Right (t :: ByteString)  -> do
      let t' = parseTime defaultTimeLocale "%Y-%m-%d" (BS8.unpack t)
      maybe (finishEarly 400 "malformed date format") (return . id) t'
      --tryJust (badReq "invalid GET date format") t'
    Left _ -> liftIO getCurrentTime

-- Every page render calls this handler to get an "app context".  This
-- context struct contains things like is the user logged in, what's
-- his name, etc.  This is used on client-side to implement login
-- screen, among other things.
restAppContext :: H ()
restAppContext = replyJson get
  where
    get user@(Model.User _ login) = do
      today <- getToday
      (weight, options) <-
        withDb $ \conn -> do
          weight <- Model.queryTodaysWeight conn user today
          options <- Model.queryOptions conn user
          return (weight, options)
      return . Right $ AppContext True Nothing (Just (LoggedInContext login weight options))

restClearWeight :: H ()
restClearWeight = replyJson $ \user -> do
  weightId <- RowId <$> reqParam "id"
  withDb $ \conn -> Right <$> Model.deleteWeight conn user weightId

restSetWeight :: H ()
restSetWeight = replyJson $ \user -> do
  today  <- getToday
  weight <- reqParam "weight"
  withDb $ \conn -> Right <$> Model.setWeight conn user today weight

restListWeights :: H ()
restListWeights =
  replyJson $ \user -> do
    today     <- getToday
    lastNDays <- reqParam "days"
    withDb $ \conn -> Right <$> Model.queryWeights conn user today lastNDays

restAddNote :: H ()
restAddNote = replyJson $ \user -> do
  today    <- getToday
  noteText <- reqParam "text"
  withDb $ \conn -> Right <$> Model.addNote conn user today noteText

restDeleteNote :: H ()
restDeleteNote = replyJson $ \user -> do
  noteId <- reqParam "id"
  withDb $ \conn -> Right <$> Model.deleteNote conn user noteId

restListNotes :: H ()
restListNotes = replyJson $ \user -> do
  today <- getToday
  withDb $ \conn -> Right <$> Model.queryTodaysNotes conn user today

----------------------------------------------------------------------
-- Workout related AJAX entry points

restListExerciseTypes :: H ()
restListExerciseTypes = anonReplyJson $ \_user -> do
  withDb $ \conn -> Right <$> Model.queryExercises conn

-- TODO need to check for dupes by lower case name here, and return
-- error if already exists
restNewExerciseType :: H ()
restNewExerciseType = replyJson $ \_user -> do
  name <- reqParam "name"
  ty   <- reqParam "type" >>= either (finishEarly 400 . BS8.pack) return . textToExerciseType
  withDb $ \conn ->
    Right <$> Model.addExercise conn name ty

restQueryWorkouts :: H ()
restQueryWorkouts = do
  wrkId <- getParam "id"
  maybe (replyJson listWorkouts) (anonReplyJson . oneWorkout) wrkId
  where
    oneWorkout id_ user = do
      workoutId_ <- either (finishEarly 400) return (parseParam id_)
      workout <- withDb $ \conn -> Model.queryWorkout conn user (RowId workoutId_)
      maybe (finishEarly 400 "missing or unauthorized workout access") (return . Right) workout

    listWorkouts user = do
      today <- getToday
      withDb $ \conn -> Right <$> Model.queryTodaysWorkouts conn user today

restNewWorkout :: H ()
restNewWorkout = replyJson $ \user -> do
  today <- getToday
  withDb $ \conn -> Right <$> Model.createWorkout conn user today

restAddExerciseSet :: H ()
restAddExerciseSet = replyJson $ \user -> do
  workoutId_  <- RowId <$> reqParam "workoutId"
  exerciseId_ <- RowId <$> reqParam "exerciseId"
  reps        <- reqParam "reps"
  weight      <- reqParam "weight"
  withDb $ \conn -> Right <$> Model.addExerciseSet conn user workoutId_ exerciseId_ reps weight

restDeleteExerciseSet :: H ()
restDeleteExerciseSet = replyJson $ \user -> do
  setId_ <- RowId <$> reqParam "id"
  withDb $ \conn -> Right <$> Model.deleteExerciseSet conn user setId_

restQueryWorkoutHistory :: H ()
restQueryWorkoutHistory = replyJson $ \user -> do
  limit <- reqParam "limit"
  today <- getToday
  withDb $ \conn -> Right <$> Model.queryPastWorkouts conn user today limit

restModifyWorkout :: H ()
restModifyWorkout = replyJson modify
  where
    modify user = do
      parms <- reqJSON
      withDb $ \conn -> do
        Model.makeWorkoutPublic conn user (wputWorkoutId parms) (wputPublic parms)
        Right <$> Model.queryWorkout conn (Just user) (wputWorkoutId parms)
