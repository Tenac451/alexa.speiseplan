/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('./node_modules/alexa-sdk');
var http = require('http');
const APP_ID = undefined; // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en': {
        translation: {
            "STOP_MESSAGE": "Guten Appetit"
        },
    },
    'de': {
        translation: {
            "STOP_MESSAGE": "Guten Appetit"
        },
    },
};

const handlers = {
    'LaunchRequest': function() {
        var responseString = '',
            mythis = this,
            speechOutput = '',
            menuObj,
            output,
            nomenu,
            dataUri = 'http://kantine.telegrafenberg.de/speiseplan/api.php?lang=de&date=today',
            date = new Date;
        if (date.getHours() > 14) {
            dataUri = 'http://kantine.telegrafenberg.de/speiseplan/api.php?lang=de&date=tomorrow';
        }
        http.get(dataUri, (res) => {
            res.on('data', (d) => {
                responseString += d;
            });

            res.on('end', function(res) {
                menuObj = JSON.parse(responseString);
                if(menuObj.hasOwnProperty('weekday')){
                  output(menuObj);
                } else {
                  nomenu();
                }

            });
        }).on('error', (e) => {
            console.error(e);
        });

        output = function(menuObj) {
            if (menuObj) {
                speechOutput += 'Hier das Essen für ' + menuObj.weekday + ' auf dem Telegrafenberg <break time="0.5s"/>';
                for (var prop in menuObj.menu) {
                    if (menuObj.menu.hasOwnProperty(prop)) {
                        speechOutput += prop + '<break time="0.5s"/>';
                        speechOutput += menuObj.menu[prop].title.replace(/&/g, " und ") + '<break time="1s"/>';
                    };
                }
                speechOutput += '<break time="1s"/> Das war der Speiseplan für '+ menuObj.weekday + '<break time="1s"/> Guten Appetit';
                mythis.emit(':tell', speechOutput);
            }
        },
        nomenu = function(){
          speechOutput = 'Entschuldige, leider liegt kein Speiseplan vor.';
          mythis.emit(':tell', speechOutput);
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function() {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function() {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function() {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function() {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function(event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
