const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const Timer = require('../../util/timer');
const nets = require('nets');

const iconURI = 'data:image/png;base64,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';

class Scratch3Example {
    constructor (runtime) {
        this.runtime = runtime;
        this.hatBlockCondition = false;
    }

    getInfo () {
        return {
            id: 'example',
            name: 'Example',
            blockIconURI: iconURI,
            blocks: [
                {
                  opcode: 'hatBlockFunction',
                  blockType: BlockType.HAT,
                  text: 'Hat block'
                },
                {
                  opcode: 'commandBlockFunction',
                  blockType: BlockType.COMMAND,
                  text: 'Run the hat block'
                },
                {
                  opcode: 'reporterBlockFunction',
                  blockType: BlockType.REPORTER,
                  text: 'Add [NUM1] to [NUM2]',
                  arguments: {
                    NUM1: {
                      type: ArgumentType.NUMBER,
                      defaultValue: '1'
                    },
                    NUM2: {
                      type: ArgumentType.NUMBER,
                      defaultValue: '2'
                    }
                  }
                },
                {
                  opcode: 'reporterWaitFunction',
                  blockType: BlockType.REPORTER,
                  text: 'Get name from server'
                }
            ]
        };
    }

    hatBlockFunction (args) {
      if (this.hatBlockCondition) {
        this.hatBlockCondition = false;
        return true; // Hat block function executes if true.
      }
      return false;
    }

    commandBlockFunction (args) {
      this.hatBlockCondition = true;
    }

    reporterBlockFunction (args) {
      var num1 = Cast.toNumber(args.NUM1);
      var num2 = Cast.toNumber(args.NUM2);
      return num1 + num2;
    }

    reporterWaitFunction (args) {
      var promise = new Promise((resolve, reject) => {
        this.makeCall(resolve);
      });
      return promise;
    }

    makeCall(callback) {
      var formData = {};
        nets({
            url: 'https://reqres.in/api/users/2',
            headers: {
              'Content-Type': 'application/json'
            },
            method: 'GET',
            body: formData,
            encoding: undefined
        }, function(err, response, body) {
            if (body == null || body == undefined) {
              callback('');
              return;
            }
            var json = JSON.parse(body);
            callback(`${json.data.first_name} ${json.data.last_name}`);
        });
    }
}

module.exports = Scratch3Example;
