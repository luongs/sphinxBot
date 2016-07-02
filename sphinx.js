/*jslint node: true */
/*jslint esversion: 6 */
"use strict";

require('dotenv').config();
let Botkit = require('./lib/Botkit.js');
let os = require('os');

let controller = Botkit.slackbot({
  debug: false
});

let RIDDLE = {};
let riddleJSON = JSON.parse(require("fs").readFileSync("./riddle.json", "utf8"));
let riddles = riddleJSON.riddleArray;
let shuffledRiddles = shuffle(riddles);

// shuffle using Fisher-Yates Shuffle algorithm
function shuffle(riddles){
  let currentIndex = riddles.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle
  while (0 !== currentIndex) {

    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = riddles[currentIndex];
    riddles[currentIndex] = riddles[randomIndex];
    riddles[randomIndex] = temporaryValue;
  }

  return riddles;
}

// connect bot to messages
controller.spawn({
  token: process.env.TOKEN
}).startRTM();

// bot listens to commands
controller.hears(['(H|hello)', '(H|hi)'], 'direct_message,direct_mention,mention', function(bot, message){

  bot.reply(message, 'Hello. I am '+bot.identity.name+' the riddle bot.');
  bot.reply(message, 'Enter `riddle` when you are ready.');
});

RIDDLE.SKIP = "skip";
RIDDLE.QUIT = "quit";
RIDDLE.RIDDLE = "riddle";
RIDDLE.ANSWER = "answer";
RIDDLE.TRYAGAIN = "try again";

controller.hears(['riddle'], 'direct_message,direct_mention,mention', function(bot, message){

  let index = 0;
  let askRiddle;
  let checkAnswer;
  let askRetry;
  let checkRetryAnswer;
  let skipRiddle;
  let quitBot;


  askRiddle = function(response, convo) {
    if (index<shuffledRiddles.length){
      let riddleStr = shuffledRiddles[index].riddle;
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
  };

  checkAnswer = function(response, convo) {
    let answer = response.text.toLowerCase();
    if (answer === RIDDLE.SKIP){
      skipRiddle(response, convo);
    }
    else if (answer === RIDDLE.QUIT){
      quitBot(response, convo);
    }
    else if (answer === shuffledRiddles[index].answer){
      convo.say("Correct.");
      index++;
      askRiddle(response, convo);
      convo.next();
    }
    else {
      convo.say("Incorrect.");
      askRetry(response, convo);
      convo.next();
    }
  };

  askRetry = function(response, convo) {
    convo.ask("`try again`, `get answer`, `skip` or `quit`?",
               function(response, convo){
                checkRetryAnswer(response, convo);
                convo.next();
               });
  };

  checkRetryAnswer = function(response, convo) {
    if (response.text.toLowerCase() === RIDDLE.TRYAGAIN){
      askRiddle(response, convo);
      convo.next();
    }
    else if (response.text.toLowerCase() === "get answer" || response.text.toLowerCase() === RIDDLE.ANSWER){
      convo.say("The answer is: "+shuffledRiddles[index].answer);
      index++;
      askRiddle(response,convo);
      convo.next();
    }
    else if (response.text.toLowerCase() === RIDDLE.SKIP){
      skipRiddle(response, convo);
      convo.next();
    }
    // for quit and any other command typed in
    else {if (response.text.toLowerCase() === RIDDLE.QUIT)
      quitBot(response, convo);
      convo.next();
    }

  };

  skipRiddle = function(response, convo) {
    index++;
    askRiddle(response, convo);
    convo.next();
  };

  quitBot = function(response, convo) {
    convo.say("Goodbye.");
    convo.next();
  };

  if (message.text.toLowerCase() === RIDDLE.RIDDLE){
    bot.startConversation(message, askRiddle);
  }
});

