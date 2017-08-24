{-# LANGUAGE TemplateHaskell, OverloadedStrings, ScopedTypeVariables, Rank2Types #-}

import           Network.Wreq
import           Test.Framework
import           Test.Framework.Providers.HUnit

import           Test
import           Workout
import           Weight

main :: IO ()
main =
  defaultMain
  [ testGroup "require auth fail" requireAuthFail
  , buildTest $ createUserTests [ ("logged in after create user?", testLoggedInOK) ]
  , buildTest $ loginUserTests  [ ("logged in?",       testLoggedInOK)
                                , ("Add exercise 1",   testAddExercise "chin-ups" "BW")
                                , ("Add exercise 2",   testAddExercise "deadlift" "W")
                                , ("Add exercise 3",   testAddExercise "planking" "T")
                                , ("Create workout",   testWorkout)
                                , ("Delete sets",      testSetDelete)
                                , ("Delete sets 2",    testSetDelete2)
                                , ("Add note",         testAddNote)
                                , ("Set/clear weight", testSetWeight)
                                , ("Create workout 2", testWorkoutTime)
                                ]
  , testCase "require 404" $ testUnknownAPIEndpoint "/api/foo"
--                                ]
--  , testCase "workout perms" testAccessRights
--  , testCase "change passwd" testChangePassword
  ]
  where
    requireAuthFail =
      map (\u -> testCase u (testLoggedInFail (mkUrl u) defaults)) authReqd
    -- REST entry points which require user to be logged in
    authReqd = [ "/api/todo"
               , "/api/user"
               ]