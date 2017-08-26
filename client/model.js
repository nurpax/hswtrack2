define(['jquery', 'underscore', 'app/class'], function($, _, obj) {
  "use strict";

  var Class = obj.Class;

  function calcExerciseStats(e) {
    if (e.type == "BW") {
      return _.reduce(e.sets, function (a, s) { return a+s.reps; }, 0);
    }
    else if (e.type == "W" || e.type == 'T') {
      return _.reduce(e.sets, function (a, s) { return a+s.reps*s.weight; }, 0);
    }
    console.error("unknown type "+e.type);
  }

  function loadExerciseTypes() {
    return $.ajax({
      type: "GET",
      url: "/rest/exercise"
    });
  }

  function sortExerciseTypes(lst) {
    return _.sortBy(lst, function (e) { return e.name; });
  }

  function loadWorkout(id) {
    return $.ajax({
      type: "GET",
      url: "/rest/workout",
      data: { id: id }
    });
  }

  var Exercise = Class.extend({
    init: function() {
      this.exercises  = [];
      this.setStateCB = null;
    },

    load: function () {
      $.when(loadExerciseTypes())
          .done(function (data) {
            this.exercises = sortExerciseTypes(data.payload);
            this.setStateCB(this);
          }.bind(this));
    },

    add: function (e) {
      $.ajax({
        url: "/rest/exercise",
        type: "POST",
        data: e,
        success: function (resp) {
          this.exercises = sortExerciseTypes(this.exercises.concat([resp.payload]));
          this.setStateCB(this);
        }.bind(this)
      });
    }
  });

  var Workout = Class.extend({
    init: function(id) {
      this.workout = { id: id, exercises: [] };
      this.exerciseTypes = [];
      this.canEdit       = false;
      this.setStateCB = null;
    },

    load: function () {
      $.when(loadWorkout(this.workout.id), loadExerciseTypes())
          .done(function (w, e) {
            this.workout = w[0].payload;
            this.exerciseTypes = sortExerciseTypes(e[0].payload);
            // Is this workout editable by the currently logged in user?
            if (w[0].loggedIn) {
              this.canEdit = w[0].userId == w[0].payload.userId;
            }
            this.setStateCB(this);
          }.bind(this));
    },

    addSet: function (params) {
      $.ajax({ url: "/rest/workout/exercise",
              type: "POST",
              data: params,
              success: function (resp) {
                var exercise = _.find(this.workout.exercises, function (s) { return s.id == params.exerciseId; });
                if (!exercise) {
                  // No existing exercise.sets in the current workout,
                  // so rather than try to create one locally, reload
                  // the whole workout.
                  this.load();
                  return;
                }
                exercise.sets.push(resp.payload);
                this.setStateCB(this);
              }.bind(this)
      });
    },

    rmSet: function (params) {
      $.ajax({ url: "/rest/workout/exercise",
              type: "DELETE",
              data: params,
              success: function () {
                // Delete the removed set from the client copy of the
                // workout/exercises/sets data structure.
                for (var i = 0; i < this.workout.exercises.length; i++) {
                  var sets = this.workout.exercises[i].sets;
                  if (_.find(sets, function (s) { return s.id == params.id; })) {
                    this.workout.exercises[i].sets = _.filter(sets, function (s) { return s.id != params.id; });
                    this.setStateCB(this);
                    return;
                  }
                }
              }.bind(this)
      });
    },

    makePublic: function (workout, setPublic) {
      $.ajax({ url: "/rest/workout",
              type: "PUT",
              dataType: "json",
              data: JSON.stringify({ id: workout.id, public: setPublic }),
              success: function (resp) {
                this.workout.public = resp.payload.public;
                this.setStateCB(this);
              }.bind(this)
      });
    }
  });

  function loadWorkouts() {
    return $.ajax({
      type: "GET",
      url: "/rest/workout"
    });
  }

  // Workout list for today
  var WorkoutList = Class.extend({
    init: function() {
      this.workouts = [];
      this.setStateCB = null;
    },

    newWorkout: function () {
      $.ajax( { url: "/rest/workout",
               type: "POST",
               data: [],
               success: function (resp) {
                 var w = resp.payload;
                 this.workouts.push(w);
                 this.setStateCB(this);
               }.bind(this)
      });
    },

    load: function () {
      $.when(loadWorkouts())
          .done(function (w) {
            this.workouts = w.payload;
            this.setStateCB(this);
          }.bind(this));
    },
  });

  function loadAppContext() {
    return $.ajax({
      type: "GET",
      url: "/rest/app",
      data: []
    });
  }


  return {
    'calcExerciseStats': calcExerciseStats,
    'WeightTop': WeightTop,
    'Exercise': Exercise,
    'Workout': Workout,
    'WorkoutList': WorkoutList
  };
});
