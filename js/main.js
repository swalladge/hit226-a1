
/**
 * @project HIT226 Assignment 1
 * @author Samuel Walladge
 */

/**
 * @class
 * An object to control an interactive quiz. 
 * Can be setup with a form element containing inputs/buttons/etc with appropriate class names.
 * Note: constructor params are optional (if set, will call `init` or `setCanvas` where appropriate.
 * @constructor
 * @param {String|undefined} form - if defined, init the quiz on the form
 * @param {String|undefined} canvas - if defined, set the canvas
 */
var Quiz = function(form, canvas) {
  this.canvas = null;
  this.ctx = null;
  this.form = null;
  this.name = null;
  this.questions = null;
  this.numQuestions = 0;

  // if form and/or canvas set, init
  if (form) {
    this.init(form);
  }
  if (canvas) {
    this.setCanvas(canvas);
  }
};


/**
 * set the canvas for the quiz to draw to
 * (for displaying scores, etc. on checking answers
 * @param {String} canvas - the canvas css selector (must return one canvas object)
 */
Quiz.prototype.setCanvas = function(canvas) {
  var canvas = $(canvas);
  if (canvas && canvas.length != 1) {
    console.log("ERROR: selector returned more than one dom element");
    return false; // fail, no canvas
  }
  canvas = canvas[0]; // get the raw dom object (using javascript drawing)
  if (canvas.getContext) { // check if can use canvas element
    this.canvas = canvas; 
    this.ctx = canvas.getContext('2d');
  } else {
    console.log("ERROR: object not a canvas or canvas operations not supported");
  }
  return true;
};

/**
 * check answers (called on user submit quiz)
 */
Quiz.prototype.checkAnswers = function() {
  // save the answers first
  this.saveAnswers();

  // setup the canvas for displaying answers... bla blah TODO
  this.ctx.fillstyle = "#0000AA";
  this.ctx.fillRect(10, 10, 30, 40);

  // loop over each question in the database and check if answer correct
  for (var key in this.qData) {
    var data = this.qData[key];

    if (data.type == 'text') {
      if (data.answer && data.correctAnswer && (new RegExp(data.correctAnswer, 'i')).test(data.answer)) {
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    } else if (data.type == 'select') {
      if (data.answer === data.correctAnswer) { // using triple equals to avoid problems if answer is undefined
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    } else if (data.type == 'radio') {
      if (data.answer === data.correctAnswer) {
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    }

  }

  // TODO: use the canvas to draw fancy ticks, crosses, visual feedback, etc.

  return false;
};

/**
 * save all answers to localstorage. `autosave` uses this method when saving
 */
Quiz.prototype.saveAnswers = function() {

  this.questions.each(function(i, q) {
    q = $(q);
    t = q.prop('type');
    var question = q.prop('name');
    var key = this.name + '.' + q.prop('name');
    var value = $.trim(q.val());
    if (t == 'text') {
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    } else if (t == 'radio') {
      if (q.prop('checked')) {
        localStorage.setItem(key, value);
        this.qData[question].answer = value;
      }
    } else if (q[0].tagName == 'SELECT') {
      value = q.find('option:selected').val();
      localStorage.setItem(question, value);
      this.qData[question].answer = value;
    }
  }.bind(this));

  return false;
};


/**
 * load all answers from localstorage if saved answers available
 */
Quiz.prototype.loadAnswers = function() {

  this.questions.each(function(i, q) {
    q = $(q);
    t = q.prop('type');
    var question = q.prop('name');
    var key = this.name + '.' + q.prop('name');
    var value = localStorage.getItem(key);
    this.qData[question].answer = value;
    if (value) {
      if (t == 'text') {
        q.val(value);
      } else if (t == 'radio') {
        if (q.val() == value) {
          q.prop('checked', true);
        }
      } else if (q[0].tagName == 'SELECT') {
        q.find('option').each(function(i, opt) {
          if (opt.value == value) {
            opt.selected = true;
          }
        }.bind(this));
      }
    }
  }.bind(this));

  return false;
};

/**
 * reset the quiz - resets form and wipes localstorage for this quiz
 */
Quiz.prototype.reset = function() {
  //TODO: error checking in these functions to make sure form element accessible, etc. before continuing

  // remove all items for this quiz from localstorage
  var questions = this.form.find('.question');
  questions.each(function(i, q) {
    q = $(q);
    var question = this.name + '.' + q.prop('name');
    localStorage.removeItem(question);
  }.bind(this));

  this.form[0].reset();

  return false;
};

/**
 * whether to automatically save the quiz or not
 * either way, can still manual save
 * @param {boolean} yes - true turns on autosave, false switches off
 */
Quiz.prototype.autosave = function(yes) {
  if (!this.form) {
    return;
  }
  if (yes) {
    // add event handlers to save answers whenever answer changed
    this.form.find('.question').change(this.saveAnswers.bind(this));
    this.form.find('.question[type=text]').on('keyup', this.saveAnswers.bind(this));
  } else {
    // remove event handlers, so will not autosave
    this.form.find('.question').off();
  }

};

/**
 * initialize the quiz on a form
 * @param {string} formId - the css selector for the form element to use (must return one element!)
 */
Quiz.prototype.init = function(formId) {

  this.name = formId;
  this.form = $(formId);
  if (!this.form) {
    console.log("ERROR: no form element found with selector to init quiz");
    return false; // fail, no form
  } else if (this.form.length != 1) {
    console.log("ERROR: selector returned more than one dom element");
    return false; // fail, no form
  }


  this.questions = this.form.find('.question');

  this.qData = {};

  // check answers on user submit
  // note - functions expected to return false to avoid actually submitting form
  this.form.find('.submitquiz').click(this.checkAnswers.bind(this));

  // save and load buttons
  this.form.find('.savequiz').click(this.saveAnswers.bind(this));
  this.form.find('.loadquiz').click(this.loadAnswers.bind(this));
  this.form.find('.resetquiz').click(this.reset.bind(this));

  // init a dictionary of the questions and values (correct and otherwise) for ease of getting later
  var count = 1;
  for (var i = 0; i < this.questions.length; i++) {
    q = $(this.questions[i]);
    t = q.prop('type');
    var question = q.prop('name');
    if (t == 'text') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].type = 'text';
      this.qData[question].index = count++;
    } else if (t == 'radio') {
      if (q.data('answer') !== undefined) {
        this.qData[question] = {};
        this.qData[question].correctAnswer = q.data('answer').toString();
        this.qData[question].index = count++;
        this.qData[question].type = 'radio';
      }
    } else if (q[0].tagName == 'SELECT') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].index = count++;
      this.qData[question].type = 'select';
    }

  }

  this.numQuestions = Object.keys(this.questions).length;

  return true;
};



/**
 * code to run when page loads
 * - sets up the quizzes and other things where needed
 */
$(document).ready(function() {

  //TODO: make this non-global when finished testing
  thequiz = new Quiz();

  // init the quiz on the element selector
  thequiz.init("#quizform");

  // specify the canvas to use
  thequiz.setCanvas('#quizcanvas');

  // turn on autosave and load saved answers
  thequiz.autosave(true);
  thequiz.loadAnswers();

});


