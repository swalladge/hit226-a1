
/**
 * @file main.js
 * @project HIT226 Assignment 1
 * @copyright Samuel Walladge 2016
 * @license MIT
 */

/*
 * I am releasing this file, including and limited to the code within (quiz class, helper functions, example jquery to setup quiz), under the terms of the MIT License for the convenience of those who wish to have a quiz on their website somewhere.
 * Copyright (c) 2016 Samuel Walladge
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


// help for creating classes in javascript found at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript
// Note: did not use new ecmascript 6 class fanciness, since not widely supported
/**
 * @class
 * An object to control an interactive quiz.
 * Can be setup with a form element containing inputs/buttons/etc with appropriate class names.
 * Note: constructor params are optional (if set, will call `init` or `setCanvas` where appropriate) - can always setup later.
 * @constructor
 * @param {String|undefined} form - if defined, init the quiz on the form
 * @param {String|undefined} canvas - if defined, set the canvas
 */
var Quiz = function(form, canvas) {
  this.canvas = undefined;
  this.ctx = undefined;
  this.form = undefined;
  this.name = undefined;
  this.questions = undefined;
  this.numQuestions = 0;
  this.numCorrect = 0;
  this.qData = {};
  this.useCanvas = true;

  // if form and/or canvas set, init
  if (form) {
    this.init(form, canvas);
  } else if (canvas) {  // only setcanvas here if no form set, but canvas set
    this.setCanvas(canvas);
  }
};

Quiz.prototype.noCanvas = function() {
  this.canvas = undefined;
  this.ctx = undefined;
  this.useCanvas = false;
};

/**
 * set the canvas for the quiz to draw to
 * (for displaying scores, etc. on checking answers
 * @param {Object|undefined} canvas - the canvas dom object to use
 * @return Returns true if a canvas has been set for the quiz (otherwise, false)
 */
Quiz.prototype.setCanvas = function(canvas) {

  // attempt to autoset the canvas if 'canvas' not defined
  if (!canvas) {
    if (this.form && this.useCanvas) {
      canvas = this.form.getElementsByClassName('quiz-canvas');
    } else {
      return false;
    }
  }

  if (canvas.length != 1) {
    console.log("QUIZ ERROR: canvas was nothing or more than one dom element");
    return false; // fail, no canvas
  }

  if (canvas.getContext) { // check if can use canvas element
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.tabIndex = 0; // set tabindex on canvas to make it focusable. source: http://stackoverflow.com/questions/30247762/how-to-change-focus-to-new-html5-canvas-element
  } else {
    this.canvas = undefined;
    this.ctx = undefined;
    console.log("QUIZ ERROR: canvas object not a canvas or canvas operations not supported");
    return false;
  }

  // finally, it worked!
  this.useCanvas = true;
  return true;
};

/**
 * check answers (called on user submit quiz)
 * @return Returns false, thus preventing default button action from happening
 */
Quiz.prototype.checkAnswers = function() {
  // save the answers first
  this.saveAnswers();

  // lets confirm this - avoid cases where user accidentally submits when only answered a few questions.
  if (!confirm("Are you sure you wish to submit the quiz and check your answers?")) {
    return false;
  }

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
    } else if (data.type == 'checkbox') {
      var ok = true;
      for (var k in data.correctAnswer) {
        if (data.answer[k] != data.correctAnswer[k]) {
          ok = false;
          break;
        }
      }
        if (ok) {
          correct = true;
        }
    }

    // using 'display: table' to have container width same as content, and have linebreak before and after it.
    var feedbackElements;
    if (correct) {
      this.numCorrect++;
      this.qData[key].iscorrect = true;
      feedbackElements = this.qData[key].element.parentNode.getElementsByClassName('quiz-feedback');
      for (var i=0; i<feedbackElements.length; i++) {
        feedbackElements[i].style.display = 'table';
        feedbackElements[i].style.color = '#33AA33';
        feedbackElements[i].innerText = '✔ Corrct';
      }
    } else {
      this.qData[key].iscorrect = false;
      feedbackStyle.color = "#AA3333";
      feedbackElements = this.qData[key].element.parentNode.getElementsByClassName('quiz-feedback');
      for (var i=0; i<feedbackElements.length; i++) {
        feedbackElements[i].style.display = 'table';
        feedbackElements[i].style.color = '#AA3333';
        feedbackElements[i].innerHTML = '✘ Wrong...';
      }
      var explanation = this.qData[key].element.parentNode.getElementsByClassName('quiz-explanation');
      for (var i=0; i<explanation.length; i++) {
        explanation[i].style.display = 'table';
      }
    }

  }

  this.displayCanvas();

  return false;
};

/**
 * hide the feedback messages for each question
 */
Quiz.prototype.hideFeedback = function() {
  var feedbackElements = this.form.getElementsByClassName('quiz-feedback');
  for (var i=0; i<feedbackElements.length; i++) {
    feedbackElements[i].style.display = 'none';
  }

  var explanation = this.form.getElementsByClassName('quiz-explanation');
  for (var i=0; i<explanation.length; i++) {
    explanation[i].style.display = 'table';
  }
};

/**
 * display the canvas feedback chart
 */
Quiz.prototype.displayCanvas = function() {

  // don't try displaying a canvas if no canvas set
  // also don't error, because a canvas is optional for the quiz
  if (!this.canvas) {
    return;
  }

  var hideCanvas = function() {
    console.log(this.canvas);
      this.canvas.style.display = 'none';
  }.bind(this);

  // hide canvas popup on click or keypress
  this.canvas.addEventListener('click', hideCanvas);
  this.canvas.addEventListener('keypress', hideCanvas);

  // setup the styles for the canvas and display it
  this.canvas.style.display = 'block';
  this.canvas.style.position = 'fixed';
  this.canvas.style.left = '0';
  this.canvas.style.right = '0';

  // set focus
  this.canvas.focus();

  // setup some variables
  // need to use raw dom element here, otherwise drawing dimensions get messed up
  var width = this.canvas.width = window.innerWidth;
  var height = this.canvas.height = window.innerHeight;
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
    if (this.numCorrect/this.numQuestions >= 0.7) {
      message = "Excellent!";
    } else if (this.numCorrect/this.numQuestions >= 0.5) {
      message = "You passed.";
    } else {
      message = "Try again.";
    }
  } else {
    wholePizza(ctx, "#CC3333", width/2, height/2, radius);
    result = "0%";
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
  ctx.fillText("tap to return", width/2, (height/2)+90);

};

/**
 * save all answers to localstorage. `autosave` uses this method when saving
 * @param {Object|undefined} event - if defined, hides the feedback text from question that trigged the event,
 *                                   or all feedback if trigged from something else
 */
Quiz.prototype.saveAnswers = function(e) {

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to save answers, but I don't have a form element.");
    return;
  }

  // hide the correct/wrong messages for the current question being changed (if defined),
  //  otherwise hide all
  if (e && e.currentTarget.name in this.qData) {
    var toHide = e.currentTarget.parentNode.querySelectorAll('.quiz-feedback, .quiz-explanation');
    for (var i=0; i<toHide.length; i++) {
      toHide[i].style.display = 'none';
    }
  } else {
    this.hideFeedback();
  }

  // go through each question element, extract data, and store them
  // Help with localStorage found at https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  for (var i=0; i<this.questions.length; i++ ) {
    var q = this.questions[i];
    var t = q.type;
    var question = q.name;
    var key = this.name + '.' + question;
    var value = q.value.trim();
    if (t == 'text') {
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    } else if (t == 'radio') {
      if (q.checked) {
        localStorage.setItem(key, value);
        this.qData[question].answer = value;
      }
    } else if (t == 'checkbox') {
      if (q.checked) {
        localStorage.setItem(key + "[" + value + "]", true);
        this.qData[question].answer[value] = true;
      } else {
        localStorage.setItem(key + "[" + value + "]", false);
        this.qData[question].answer[value] = false;
      }
    } else if (q.tagName == 'SELECT') {
      value = q.querySelector('option:selected').value;
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    }
  }

  return true;
};



/**
 * load all answers from localstorage if saved answers available
 */
Quiz.prototype.loadAnswers = function() {

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to load answers, but I don't have a form element.");
    return;
  }

  // answers possibly changed, reset the feedback messages
  this.hideFeedback();

  this.questions.each(function(i, q) {
    q = $(q);
    t = q.prop('type');
    var question = q.prop('name');
    var key = this.name + '.' + q.prop('name');
    var value = localStorage.getItem(key);
    if (t == 'text') {
      this.qData[question].answer = value;
      q.val(value);
    } else if (t == 'radio') {
      this.qData[question].answer = value;
      if (q.val() == value) {
        q.prop('checked', true);
      }
    } else if (t == 'checkbox') {
      if (!this.qData[question].answer) {
        this.qData[question].answer = {};
      }
      checked = localStorage.getItem(key + "[" + q.val() + "]");
      this.qData[question].answer[q.val()] = checked;
      if (checked === 'true') {
        q.prop('checked', true);
      } else {
        q.prop('checked', false);
      }
    } else if (q[0].tagName == 'SELECT') {
      this.qData[question].answer = value;
      q.find('option').each(function(i, opt) {
        if (opt.value == value) {
          opt.selected = true;
        }
      }.bind(this));
    }
  }.bind(this));

  return false;
};

/**
 * reset the quiz - resets form and wipes localstorage for this quiz
 * @return Returns false, thus preventing default button action from happening
 */
Quiz.prototype.reset = function() {

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to reset, but I don't have a form element.");
    return;
  }

  // confirm a reset - users hate having to re-type a heap of answers :\
  if (!confirm("You are about to irreversably reset the quiz. Are you sure you wish to continue?")) {
    return false;
  }

  // remove all items for this quiz from localstorage
  // using substr method (emulating startsWith) to remove entries for this quiz only
  var len = this.name.length + 1;
  var namespace = this.name + '.';
  for (var k in localStorage) {
    if (k.substr(0, len) == namespace) {
      localStorage.removeItem(k);
    }
  }

  this.form[0].reset();

  // hide all the correct/wrong messages
  this.hideFeedback();

  return false;
};

/**
 * Whether to automatically save the quiz or not.
 * either way, can still manually save
 * @param {boolean} yes - true turns on autosave, false switches off
 */
Quiz.prototype.autosave = function(yes) {
  if (!this.form) {
    console.log("QUIZ ERROR: Tried to toggle autosave, but I don't have a form element.");
    return;
  }

  if (yes) {
    // add event handlers to save answers whenever answer changed
    this.form.find('.question').change(this.saveAnswers.bind(this));
    this.form.find('.question[type=text]').on('keydown', this.saveAnswers.bind(this));
  } else {
    // remove event handlers, so will not autosave
    this.form.find('.question').off();
  }

};


/**
 * initialize the quiz on a form
 * @param {String|Object} formId - the css selector (or jquery object) for the form element to use (must return one element!)
 * @param {String|Object|undefined} canvas - the css selector (or jquery object) for the canvas element to use
 */
Quiz.prototype.init = function(formId, canvas) {

  this.form = $(formId);
  this.name = this.form.prop('name');
  if (!this.form) {
    console.log("QUIZ ERROR: no form element found with selector to init quiz");
    return false; // fail, no form
  } else if (this.form.length != 1) {
    console.log("QUIZ ERROR: form selector returned more than one dom element");
    return false; // fail, no form
  }


  this.questions = this.form.find('.question');

  this.qData = {};

  // check answers on user submit
  // note - functions expected to return false to avoid actually submitting form
  this.form.find('.quiz-submit').click(this.checkAnswers.bind(this));


  // save and load buttons
  this.form.find('.quiz-save').click(this.saveAnswers.bind(this));
  this.form.find('.quiz-load').click(this.loadAnswers.bind(this));
  this.form.find('.quiz-reset').click(this.reset.bind(this));

  this.form.find('.quiz-explanation').css('display', 'none');

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
      // must insert after the legend in a fieldset to appease internet explorer...
      var legend = q.parent().find('legend');
      if (legend.length === 1) {
        legend.after(feedback);
      } else {
        q.parent().prepend(feedback);
      }
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
    } else if (t == 'checkbox') {
      if (!this.qData[question]) {
        this.qData[question] = {};
        this.numQuestions++;
        this.qData[question].index = count++;
        this.qData[question].type = 'checkbox';
        this.qData[question].element = q;
        this.qData[question].answer = {};
        this.qData[question].correctAnswer = {};
      }
      if (q.data('answer')) {
        this.qData[question].correctAnswer[q.val().toString()] = true;
      } else {
        this.qData[question].correctAnswer[q.val().toString()] = false;
      }
      this.qData[question].element.push(q);
    } else if (q[0].tagName == 'SELECT') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].index = count++;
      this.qData[question].type = 'select';
      this.qData[question].element = q;
      this.numQuestions++;
    }

  }

  // call setcanvas to attempt to auto-get the canvas
  this.setCanvas(canvas);

  return true;
};



/**
 * helper function to draw a filled arc on a canvas
 * @param {Object} ctx - canvas 2d context to use
 * @param {String} colour - canvas 2d context to use
 * @param {Number} x - x-axis value of arc centre point
 * @param {Number} y - y-axis value of arc centre point
 * @param {Number} radius - radius of the arc
 * @param {Number} start - arc starting angle
 * @param {Number} end - arc ending angle
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
 * @param {Object} ctx - canvas 2d context to use
 * @param {String} colour - canvas 2d context to use
 * @param {Number} x - x-axis value of arc centre point
 * @param {Number} y - y-axis value of arc centre point
 * @param {Number} radius - radius of the arc
 */
function wholePizza(ctx, colour, x, y, radius) {
  ctx.lineWidth = "3";
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2*Math.PI);
  ctx.fill();
}





/**
 * code to run when page loads
 * - sets up the quizzes and other things where needed
 */
window.onload = function(){
  // // the following is all required to start a quiz (shortest init form)
  // var thequiz = new Quiz(document.getElementById("#quizform"));
  // // autosaving and loadanswers here is optional
  // thequiz.autosave(true);
  // thequiz.loadAnswers();

  // // alternate, longer form of initializing a quiz
  // var thequiz = new Quiz();
  //
  // // init the quiz on the element selector
  // thequiz.init(document.getElementById("#quizform"));
  //
  // // specify the canvas to use (or leave blank to auto use available canvas
  // thequiz.setCanvas();
  //
  // // turn on autosave and load saved answers
  // thequiz.autosave(true);
  // thequiz.loadAnswers();


  // I have set the follow class on all quizzes site-wide I want to use
  //  - also all should autosave and loadAnswers on start to provide a smooth experience
  var elements = document.getElementsByClassName('my-quizzes');
  for (var i=0; i<elements.length; i++) {
    var quiz = new Quiz(elements[i]);
    quiz.autosave(true);
    quiz.loadAnswers();
  }

}();


