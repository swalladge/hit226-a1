
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
 * @param {Boolean|undefined} usecanvas - if defined, use a canvas for displaying scores (if defined, form must be defined also)
 */
var Quiz = function(form, usecanvas) {
  this.canvas = undefined;
  this.ctx = undefined;
  this.form = undefined;
  this.name = undefined;
  this.questions = undefined;
  this.numQuestions = 0;
  this.numCorrect = 0;
  this.qData = {};
  this.saveCallback = undefined;

  // if form and/or canvas set, init
  if (form) {
    this.init(form, usecanvas);
  }
};


/**
 * set the canvas for the quiz to draw to
 * (for displaying scores, etc. on checking answers
 * @param {Boolean|undefined} yes - whether to use a canvas or not. defaults to true
 * @return Returns true if a canvas has been set for the quiz (otherwise, false)
 */
Quiz.prototype.useCanvas = function(yes) {

  if (!this.form || (yes !== undefined && !yes)) {
    this.canvas = undefined;
    this.ctx = undefined;
    return false;
  }


  var canvas = document.createElement('canvas');
  if (canvas.getContext) { // check if can use canvas element
    this.canvas = canvas;
    this.canvas.style.display = 'none';
    this.canvas.style.margin = 0;
    this.canvas.style.padding = 0;
    this.canvas.classList.add('quiz-canvas');
    this.form.appendChild(this.canvas);
    this.ctx = canvas.getContext('2d');
    canvas.tabIndex = 0; // set tabindex on canvas to make it focusable. source: http://stackoverflow.com/questions/30247762/how-to-change-focus-to-new-html5-canvas-element
  } else {
    this.canvas = undefined;
    this.ctx = undefined;
    return false;
  }


  // setup initial styles here
  this.canvas.style.position = 'fixed';
  this.canvas.style.left = '0';
  this.canvas.style.top = '0';

  // add the event listeners for closing the canvas popup
  var hideCanvas = function() {
    this.canvas.style.display = 'none';
  }.bind(this);

  // hide canvas popup on click or keypress
  this.canvas.addEventListener('click', hideCanvas);
  this.canvas.addEventListener('keypress', hideCanvas);

  // finally, it worked!
  this.useCanvas = true;
  return true;
};

/**
 * check answers (called on user submit quiz)
 * @return Returns true if did check answers, false if user cancelled
 */
Quiz.prototype.checkAnswers = function(e) {

  // prevent form actually submitting
  if (e) {
    e.preventDefault();
  }

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
        feedbackElements[i].innerText = '✔ Correct';
      }
    } else {
      this.qData[key].iscorrect = false;
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

  return true;
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
    explanation[i].style.display = 'none';
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

  // setup the styles for the canvas and display it
  this.canvas.style.display = 'table';
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;

  // set focus
  this.canvas.focus();

  // setup some variables
  // need to use raw dom element here, otherwise drawing dimensions get messed up
  var width = this.canvas.width;
  var height = this.canvas.height;
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
 * @return Returns true if able to save
 */
Quiz.prototype.saveAnswers = function(e) {

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to save answers, but I don't have a form element.");
    return false;
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
      var options = q.getElementsByTagName('option');
      value = undefined;
      for (var j=0; j<options.length; j++) {
        if (options[j].selected) {
          value = options[j].value;
        }
      }
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    }
  }

  return true;
};



/**
 * load all answers from localstorage if saved answers available
 */
Quiz.prototype.loadAnswers = function(e) {

  if (e) {
    e.preventDefault();
  }

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to load answers, but I don't have a form element.");
    return;
  }

  // answers possibly changed, reset the feedback messages
  this.hideFeedback();

  for (var i=0; i<this.questions.length; i++ ) {
    var q = this.questions[i];
    var t = q.type;
    var question = q.name;
    var key = this.name + '.' + q.name;
    var value = localStorage.getItem(key);
    if (t == 'text') {
      this.qData[question].answer = value;
      q.value = value;
    } else if (t == 'radio') {
      this.qData[question].answer = value;
      if (q.value == value) {
        q.checked = true;
      }
    } else if (t == 'checkbox') {
      if (!this.qData[question].answer) {
        this.qData[question].answer = {};
      }
      checked = localStorage.getItem(key + "[" + q.value + "]");
      this.qData[question].answer[q.value] = checked;
      if (checked === 'true') {
        q.checked = true;
      } else {
        q.checked = false;
      }
    } else if (q.tagName == 'SELECT') {
      this.qData[question].answer = value;
      var options = q.getElementsByTagName('option');
      for (var j=0; j<options.length; j++) {
        var opt = options[j];
        if (opt.value == value) {
          opt.selected = true;
        }
      }
    }
  }
};

/**
 * reset the quiz - resets form and wipes localstorage for this quiz
 * @return Returns true if able to reset
 */
Quiz.prototype.reset = function(e) {

  // if event, stop form reset button from doing default, etc.
  if (e) {
    e.preventDefault();
  }

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to reset, but I don't have a form element.");
    return false;
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

  this.form.reset();

  // hide all the correct/wrong messages
  this.hideFeedback();

  return true;
};

/**
 * Whether to automatically save the quiz or not.
 * either way, can still manually save
 * @param {boolean|undefined} yes - true turns on autosave, false switches off. Defaults to true
 */
Quiz.prototype.autosave = function(yes) {

  // default to true
  if (yes === undefined) {
    yes = true;
  }

  if (!this.form) {
    console.log("QUIZ ERROR: Tried to toggle autosave, but I don't have a form element.");
    return;
  }

  if (yes) {
    this.saveCallback = this.saveCallback || this.saveAnswers.bind(this);
    // add event handlers to save answers whenever answer changed
    for (var i = 0; i < this.questions.length; i++) {
      var q = this.questions[i];
      q.addEventListener('change', this.saveCallback);
      if (q.type == 'text') {
        q.addEventListener('keydown', this.saveCallback);
      }
    }
  } else {
    // remove event handlers, so will not autosave
    for (var i = 0; i < this.questions.length; i++) {
      var q = this.questions[i];
      q.removeEventListener('change', this.saveCallback);
      if (q.type == 'text') {
        q.removeEventListener('keydown', this.saveCallback);
      }
    }

  }

};


/**
 * initialize the quiz on a form
 * @param {Object} form - the dom object for the form element to use
 * @param {Boolean|undefined} usecanvas - whether to display scores  on a canvas element (defaults to true)
 */
Quiz.prototype.init = function(form, usecanvas) {

  this.form = form;
  this.name = this.form.name;
  if (!this.form) {
    console.log("QUIZ ERROR: no form element found with selector to init quiz");
    return false; // fail, no form
  }

  this.questions = this.form.getElementsByClassName('question');

  this.qData = {};

  // check answers on user submit
  // note - functions expected to e.preventDefault to avoid actually submitting form, etc.
  var submits = this.form.getElementsByClassName('quiz-submit');
  for (var i = 0; i < submits.length; i++) {
    submits[i].addEventListener('click', this.checkAnswers.bind(this));
  }

  // save buttons
  var saves = this.form.getElementsByClassName('quiz-save');
  for (var i = 0; i < saves.length; i++) {
    saves[i].addEventListener('click', this.saveAnswers.bind(this));
  }

  // load buttons
  var loads = this.form.getElementsByClassName('quiz-load');
  for (var i = 0; i < loads.length; i++) {
    loads[i].addEventListener('click', this.loadAnswers.bind(this));
  }

  // reset buttons
  var resets = this.form.getElementsByClassName('quiz-reset');
  for (var i = 0; i < resets.length; i++) {
    resets[i].addEventListener('click', this.reset.bind(this));
  }


  // make sure the feedback elements are hidden to begin with
  this.hideFeedback();

  // init a dictionary of the questions and values (correct and otherwise) for ease of getting later
  var count = 1;
  this.numQuestions = 0;
  for (var i = 0; i < this.questions.length; i++) {
    var q = this.questions[i];
    var t = q.type;
    var question = q.name;

    // create a feedback element and add it to the question section (if not one already)
    var feedback = document.createElement('div');
    feedback.classList.add('quiz-feedback');
    feedback.style.display = 'none';
    if (q.parentNode.getElementsByClassName('quiz-feedback').length === 0) {
      // must insert after the legend in a fieldset to appease internet explorer...
      var first = q.parentNode.firstChild;
      if (first.nodeName == "#text") {
        first = first.nextSibling;
      }
      if (first && first.tagName == "LEGEND") {
        q.parentNode.insertBefore(feedback, first.nextSibling);
      } else {
        q.parentNode.insertBefore(feedback, first);
      }
    }

    if (t == 'text') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.dataset.answer;
      this.qData[question].type = 'text';
      this.qData[question].index = count++;
      this.qData[question].element = q;

      this.numQuestions++;
    } else if (t == 'radio') {
      if (q.dataset.answer) {
        this.qData[question] = {};
        this.qData[question].correctAnswer = q.dataset.answer;
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
      if (q.dataset.answer) {
        this.qData[question].correctAnswer[q.value.toString()] = true;
      } else {
        this.qData[question].correctAnswer[q.value.toString()] = false;
      }
    } else if (q.tagName == 'SELECT') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.dataset.answer;
      this.qData[question].index = count++;
      this.qData[question].type = 'select';
      this.qData[question].element = q;
      this.numQuestions++;
    }

  }

  // call setcanvas to setup canvas if wanted
  this.useCanvas(usecanvas);

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
  // // tell it to use a canvas
  // thequiz.useCanvas(true);
  //
  // // turn on autosave and load saved answers
  // thequiz.autosave(true);
  // thequiz.loadAnswers();


  // I have set the follow class on all quizzes site-wide I want to use
  //  - also all should autosave and loadAnswers on start to provide a smooth experience
  var elements = document.getElementsByClassName('my-quizzes');
  for (var e=0; e<elements.length; e++) {
    quiz = new Quiz(elements[e]);
    quiz.autosave(true);
    quiz.loadAnswers();
  }

};


