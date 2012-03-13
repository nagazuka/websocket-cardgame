function TaskQueue() {
  this.q = [];
  this.state = "INITIALIZED";
}

TaskQueue.prototype = {
  addTask: function(task) {
    if (task) {
      task.setQueue(this);
      this.q.push(task);

      if (this.state !== "RUNNING") {
          this.state = "READY";
      }
      
      this.processNextTask();

    } else {
      logger.error("Called addTask with empty task");
    }

  },

  setReady: function() {
    this.state = "READY";
  },

  processNextTask: function() {
    if  (this.state !== "RUNNING")  {
      if (this.q.length > 0) {
        var nextTask = this.q.shift();
        this.state = "RUNNING";
        nextTask.execute();
      } else {
        this.state = "STOPPED";
      }
    } 
  }
}; 

function Task() {
    this.queue = null;
}

Task.prototype = {
    onStart: function() {
    },

    execute: function() {
      this.onStart();
      this.run();
      this.onEnd();
      this.queue.setReady();
      this.processNext();
    },

    onEnd: function() {
    },

    run: function() {
      //actual task code
    },

    processNext: function() {
      if (this.queue) {
        this.queue.processNextTask(); 
      } else {
        logger.error("Task queue not correctly set for task"); 
      }
    },

    setQueue: function(queue) {
      this.queue = queue;
    }
};

function AsyncTask() {
};

AsyncTask.prototype = _.extend(Task.prototype, {
    execute: function() {
      this.onStart();
      this.run();
    },

    finish: function() {
      this.onEnd();
      this.queue.setReady();
      this.processNext();
    },

});
