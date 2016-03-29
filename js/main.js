
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
  this.numCorrect = 0;

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
  canvas = $(canvas);
  if (canvas && canvas.length != 1) {
    console.log("ERROR: selector returned more than one dom element");
    return false; // fail, no canvas
  }
  // canvas = canvas[0]; // get the raw dom object (using javascript drawing)
  if (canvas[0].getContext) { // check if can use canvas element
    this.canvas = canvas; 
    this.ctx = canvas[0].getContext('2d');
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

  // loop over each question in the database and check if answer correct
  this.numCorrect = 0;
  for (var key in this.qData) {
    var data = this.qData[key];

    var correct = false;
    if (data.type == 'text') {
      if (data.answer && data.correctAnswer && (new RegExp(data.correctAnswer, 'i')).test(data.answer)) {
        correct = true;
      }
    } else if (data.type == 'select') {
      if (data.answer === data.correctAnswer) { // using triple equals to avoid problems if answer is undefined
        correct = true;
      }
    } else if (data.type == 'radio') {
      if (data.answer === data.correctAnswer) {
        correct = true;
      }
    }

    var feedbackStyle = {
      display: 'block',
      'background-color': '#FCF2D8',
      'margin-top': '5px'
    };
    if (correct) {
      this.numCorrect++;
      this.qData[key].iscorrect = true;
      feedbackStyle.color = "#33AA33";
      this.qData[key].element.parent().find('.quiz-feedback').css(feedbackStyle).text("✔ Correct!");
    } else {
      this.qData[key].iscorrect = false;
      feedbackStyle.color = "#AA3333";
      this.qData[key].element.parent().find('.quiz-feedback').css(feedbackStyle).text("✘ Wrong...");
    }

  }

  this.displayCanvas();

  return false;
};

/**
 * hides the feedback messages for each question
 */
Quiz.prototype.hideFeedback = function() {
  for (var key in this.qData) {
      this.qData[key].element.parent().find('.quiz-feedback').css('display', 'none');
  }
};

/**
 * Display the canvas feedback chart
 * @private
 */
Quiz.prototype.displayCanvas = function() {

  // hide canvas popup on click
  this.canvas.click(function() {
    var canvasStyle = {
      display: 'none'
    };
    this.canvas.css(canvasStyle);

  }.bind(this));

  // setup the styles for the canvas and display it
  var canvasShowStyles = {
    display: 'block',
    position: 'fixed',
    left: '0',
    'top': '0',
  };
  this.canvas.css(canvasShowStyles);

  // setup some variables
  // need to use raw dom element here, otherwise drawing dimensions get messed up
  var width = this.canvas[0].width = window.innerWidth;
  var height = this.canvas[0].height = window.innerHeight;
  var start = -(0.5 * Math.PI);
  var radius = Math.min((Math.min(width,height)/2)-30, 350);
  var ctx = this.ctx;

  // this is setting up a pie chart to show how many quiz responses correct
  // Inspiration and help for drawing circles/pie charts found at http://www.scriptol.com/html5/canvas/circle.php
  var result, message;
  if (this.numCorrect == this.numQuestions) {
    wholePizza(ctx, "#33CC33", width/2, height/2, radius);
    result = "100%";
    message = "Congrats!";
  } else if (this.numCorrect > 0) {
    var halfway = ((this.numCorrect/this.numQuestions) * 2.0 * Math.PI) - (0.5 * Math.PI);
    pizzaSlice(ctx, "#33CC33", width/2, height/2, radius, start, halfway);
    pizzaSlice(ctx, "#CC3333", width/2, height/2, radius, halfway, start);
    result = this.numCorrect + "/" + this.numQuestions;
    if (this.numCorrect/this.numQuestions >= 0.5) {
      message = "Good work!";
    } else {
      message = "Try again!";
    }
  } else {
    wholePizza(ctx, "#CC3333", width/2, height/2, radius);
    result = "0";
    message = "Epic fail.";
  }


  // draw on text for feedback and info
  ctx.lineWidth = "1";
  ctx.font = "48px Roboto, Arial, sans-serif";
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.fillText(result, width/2, (height/2)-30);
  ctx.fillText(message, width/2, (height/2)+30);

  ctx.font = "18px Roboto, Arial, sans-serif";
  ctx.fillText("tap to see individual results", width/2, (height/2)+90);

};

/**
 * helper function to draw a filled arc on a canvas
 */
function pizzaSlice(ctx, colour, x, y, radius, start, end) {
  ctx.beginPath();
  ctx.lineWidth = "1";
  ctx.fillStyle = colour;
  ctx.arc(x, y, radius, start, end);
  ctx.lineTo(x, y);
  ctx.fill();
}

/**
 * helper function to draw a filled circle on a canvas
 */
function wholePizza(ctx, colour, x, y, radius) {
  ctx.lineWidth = "3";
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2*Math.PI);
  ctx.fill();
}

/**
 * save all answers to localstorage. `autosave` uses this method when saving
 * @param {Object|undefined} event - if defined, hides the feedback text from question that trigged the event, 
 *                                   or all feedback if trigged from something else
 */
Quiz.prototype.saveAnswers = function(e) {

  // hide the correct/wrong messages for the current question being changed (if defined),
  //  otherwise hide all
  if (e && e.currentTarget.name in this.qData) {
    $(e.currentTarget).parent().find('.quiz-feedback').css('display', 'none');
  } else {
    this.hideFeedback();
  }

  // go through each question element, extract data, and store them
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
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    }
  }.bind(this));

  return false;
};



/**
 * load all answers from localstorage if saved answers available
 */
Quiz.prototype.loadAnswers = function() {

  // answers possibly changed, reset the feedback messages
  this.hideFeedback();

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
          console.log(opt.value, value, opt.select);
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

  // hide all the correct/wrong messages
  this.hideFeedback();

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
  this.numQuestions = 0;
  for (var i = 0; i < this.questions.length; i++) {
    q = $(this.questions[i]);
    t = q.prop('type');
    var question = q.prop('name');

    // create a feedback element and add it to the question section (if not one already)
    var feedback = $('<div class="quiz-feedback"></div>');
    feedback.css('display', 'none');
    if (q.parent().find('.quiz-feedback').length === 0) {
      q.parent().append(feedback);
    }

    if (t == 'text') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].type = 'text';
      this.qData[question].index = count++;
      this.qData[question].element = q;

      this.numQuestions++;
    } else if (t == 'radio') {
      if (q.data('answer') !== undefined) {
        this.qData[question] = {};
        this.qData[question].correctAnswer = q.data('answer').toString();
        this.qData[question].index = count++;
        this.qData[question].type = 'radio';
        this.qData[question].element = q;
        this.numQuestions++;
      }
    } else if (q[0].tagName == 'SELECT') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].index = count++;
      this.qData[question].type = 'select';
      this.qData[question].element = q;
      this.numQuestions++;
    }

  }


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
  // TODO: allow Quiz to auto-get canvas from first canvas element (with quizcanvas class) in the form element
  thequiz.setCanvas('#quizform .quizcanvas');

  // turn on autosave and load saved answers
  thequiz.autosave(true);
  thequiz.loadAnswers();

});


