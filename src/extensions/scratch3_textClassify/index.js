const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const Timer = require('../../util/timer');
const nets = require('nets');
const iconURI = require('./assets/text_icon');

let base_url = 'https://cognimate.me:2636/nlc';
// let base_url = 'http://localhost:2635/nlc';
let read_api; 
let write_api;
let username; 
let classifier_name; //name of classifier to use
let class_name; //name of class that goes w/ the classifier
let results; //stores all results and probability
let label; //result with the highest probability

class Scratch3TextClassify {
    constructor (runtime) {
        this.runtime = runtime;

    }

    getInfo () {
        return {
            id: 'text',
            name: 'Text',
            blockIconURI: iconURI,
            blocks: [
                {
                    opcode: 'setReadAPI',
                    blockType: BlockType.COMMAND,
                    text: 'Set Read API key to [KEY]',
                    arguments:{
                        KEY:{
                            type: ArgumentType.STRING,
                            defaultValue: 'key'
                        }
                    }
                },
                {
                    opcode: 'setWriteAPI',
                    blockType: BlockType.COMMAND,
                    text: 'Set Write API key to [KEY]',
                    arguments:{
                        KEY:{
                            type: ArgumentType.STRING,
                            defaultValue: 'key'
                        }
                    }
                },
                {
                    opcode: 'setUsername',
                    blockType: BlockType.COMMAND,
                    text: 'Set username to [USER]',
                    arguments:{
                        USER:{
                            type: ArgumentType.STRING,
                            defaultValue: 'user'
                        }
                    }
                },
                {
                    opcode: 'getClassifier',
                    blockType: BlockType.COMMAND,
                    text: 'Choose text classifier using name: [IDSTRING]',
                    arguments: {
                        IDSTRING: {
                            type: ArgumentType.STRING,
                            defaultValue: 'classifier name'
                        }
                    }
                },
                {
                    opcode: 'getClass',
                    blockType: BlockType.COMMAND,
                    text: 'Set class to train: [CLASS]',
                    arguments: {
                        CLASS: {
                            type: ArgumentType.STRING,
                            defaultValue: 'class name'
                        }
                    }
                },
                {
                    opcode: 'trainText',
                    blockType: BlockType.COMMAND,
                    text: 'Send texts [TEXT] to train',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'insert text'
                        }
                    }
                },
                {
                    opcode: 'classifyText',
                    blockType: BlockType.REPORTER,
                    text: 'What kind of phrase is [TEXT]?',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'phrase'
                        }
                    }
                },
                {
                    opcode: 'getScore',
                    blockType: BlockType.REPORTER,
                    text: 'How sure are you the text is a [CLASS]?',
                    arguments:{
                        CLASS: {
                            type: ArgumentType.STRING,
                            defaultValue: 'add category here'
                        }
                    }
                }
            ],
            menus: {
                models: ['Default','RockPaperScissors'],
            }
        };
    }

    setReadAPI(args, util){
        read_api = args.KEY;
    }

    setWriteAPI(args, util){
        write_api = args.KEY;
    }

    setUsername(args, util){
        username = args.USER;
    }

    getClassifier(args, util){
        classifier_name = args.IDSTRING;
    }

    getClass(args, util){
        class_name = args.CLASS;
    }

    classifyText(args, util, callback){
        //make sure everything necessary has been set
        if(read_api == null){
            return 'Set a Read API Key';
        } else if (username == null){
            return 'No username was set';
        } else if(classifier_name == null){
            return 'No classifier name was set';
        }

        let phrase = args.TEXT;

        if (this._lastPhrase === phrase &&
            this._lastResult !== null) {
            return this._lastResult;
        }

        this._lastPhrase = phrase;
        const _this = this;
        let promise = new Promise((resolve)=>{
        this.makeClassifyCall(phrase,
            function(err, response) {
            if (err){
                console.log(err);
            }
            else {
                console.log(response);
                results = JSON.parse(response.body, null, 2);
                label = results[0].className;
                _this._lastResult = label;
                resolve(label);
            }});
        });
        promise.then(output => output);

        return promise;
    }

    makeClassifyCall(phrase, callback){
        var formData = JSON.stringify({ 
            classifier_id: classifier_name,
            classify_username: username,
            phrase: phrase,
            token: read_api
        });

        nets({
            url: base_url + "/classify/",
            headers: {
              'Content-Type': 'application/json' // important header to be included henceforth
            }, // couldn't figure out how to get x-url-encoded content-type to work
            method: 'POST',
            body: formData,
            encoding: undefined // This is important to get response as a string otherwise it returns a buffer array
          }, function(err, response){
                callback(err, response);
        });
    }

    trainText(args, util){
         //make sure everything necessary has been set
         if(write_api == null){
            return 'Set a Write API Key';
        } else if (class_name == null){
            return 'No class name was set';
        } else if(classifier_name == null){
            return 'No classifier name was set';
        }

        let phrase = args.TEXT;

        if (this._lastPhrase === phrase &&
            this._lastResult !== null) {
            return this._lastResult;
        }

        this._lastPhrase = phrase;
        const _this = this;
        let promise = new Promise((resolve)=>{
        this.makeTrainingCall(phrase,
            function(err, response) {
            if (err){
                console.log(err);
            }
            else {
                result = 'Text Data Sent';
                _this._lastResult = result;
                resolve(result);
            }});
        });
        promise.then(output => output);

        return promise;
    }

    makeTrainingCall(phrase, callback){
        var formData = JSON.stringify({ 
            classifier_id: classifier_name,
            class_name: class_name,
            phrase: [phrase],
            token: write_api
        });

        nets({
            url: base_url + "/addExamples/",
            headers: {
              'Content-Type': 'application/json' // important header to be included henceforth
            }, // couldn't figure out how to get x-url-encoded content-type to work
            method: 'POST',
            body: formData,
            encoding: undefined // This is important to get response as a string otherwise it returns a buffer array
          }, function(err, response){
                callback(err, response);
        });

    }

    getScore(args, util){
        //check that classes is not empty
        if(classes === null){
            return 'did you classify any text yet?'
        }
        var comparison_class = args.CLASS;
        //make sure the class entered is valid
        if(!classes.hasOwnProperty(comparison_class)){
            return 'this is not a valid class'
        }
        return classes[comparison_class];
    }


}

module.exports = Scratch3TextClassify;
