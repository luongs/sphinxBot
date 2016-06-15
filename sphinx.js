require('dotenv').config();
var Botkit = require('./lib/Botkit.js');
var os = require('os');

var RIDDLE = {};
var controller = Botkit.slackbot({
  debug: false
});


// connect bot to messages
controller.spawn({
  token: process.env.TOKEN
}).startRTM();

// bot listens to commands
controller.hears(['(H|hello)', '(H|hi)'], 'direct_message,direct_mention,mention', function(bot, message){

  bot.reply(message, 'Hello. I am '+bot.identity.name+' the riddle bot.');
  bot.reply(message, 'Enter `riddle` or `random` when you are ready.');
});

RIDDLE.SKIP = "skip";
RIDDLE.QUIT = "quit";
RIDDLE.RANDOM = "random";
RIDDLE.ANSWER = "answer";
RIDDLE.TRYAGAIN = "try again";

controller.hears(['riddle', 'random'], 'direct_message,direct_mention,mention', function(bot, message){

  var index = 0;

  askRiddle = function(response, convo) {
    if (index<riddles.length){
      var riddleStr = index+"): "+riddles[index].riddle;
      convo.ask(riddleStr, function (response, convo){
        checkAnswer(response, convo);
        convo.next();
      });
    }
    else {
      convo.say("Those were my riddles.");
      convo.say("Goodbye.");
      convo.next();
    }
  }

  askRandom = function(response, convo) {
    var randIndex = Math.floor(Math.random()*riddles.length);
    var riddleStr = randIndex+"): "+riddles[randIndex].riddle;
    convo.ask(riddleStr, function(response, convo){
      checkAnswer(response, convo);
      convo.next();
    });
  }

  checkAnswer = function(response, convo) {
    var answer = response.text.toLowerCase();
    if (answer === RIDDLE.SKIP){
      skipRiddle(response, convo);
    }
    else if (answer === RIDDLE.QUIT){
      quitBot(response, convo);
    }
    else if (answer === riddles[index].answer){
      convo.say("Correct.");
      index++;
      askRiddle(response, convo);
      convo.next();
    }
    else {
      convo.say("Incorrect.")
      askRetry(response, convo);
      convo.next();
    }
  }

  askRetry = function(response, convo) {
    convo.ask("`try again`, `get answer`, `skip` or `quit`?",
               function(response, convo){
                checkRetryAnswer(response, convo);
                convo.next();
               });
  }

  checkRetryAnswer = function(response, convo) {
    if (response.text.toLowerCase() === RIDDLE.TRYAGAIN){
      askRiddle(response, convo);
      convo.next();
    }
    else if (response.text.toLowerCase() === "get answer" || response.text.toLowerCase() === RIDDLE.ANSWER){
      convo.say("The answer is: "+riddles[index].answer);
      index++;
      askRiddle(response,convo);
      convo.next();
    }
    else if (response.text.toLowerCase() === RIDDLE.SKIP){
      skipRiddle(response, convo);
      convo.next();
    }
    // for quit and any other command typed in
    else {
      quitBot(response, convo);
      convo.next();
    }

  }

  skipRiddle = function(response, convo) {
    index++;
    askRiddle(response, convo);
    convo.next();
  }

  quitBot = function(response, convo) {
    convo.say("Goodbye.");
    convo.next();
  }

  if (message.text.toLowerCase() === RIDDLE.RANDOM){
    bot.startConversation(message, askRandom);
  }
  else{
    bot.startConversation(message, askRiddle);
  }
});

var riddles = [
 {"riddle":
   "Which creature has one voice and yet becomes four-footed and two-footed and three-footed?",
   "answer":
     "man"
 },

 {"riddle":
  "There are two sisters: one gives birth to the other and she, in turn, gives birth to the first. Who are the two sisters?",
  "answer":
    "day and night"
 },

 {"riddle":
  "There are 30 white horses on a red hill: first they champ, then they stamp, then they stand still. What are they?",
  "answer":
    "teeth"
 },

 {"riddle":
  "There is a house. A person enters this house blind but exits it seeing. What is it?",

  "answer":
    "school"
 },

 {"riddle":
  "Homer when asking fishermen how their day has been receives the following answer. 'What we caught, we threw away; what we didn't catch, we kept. What did we keep?",
  "answer":
    "lice"
  }
];
