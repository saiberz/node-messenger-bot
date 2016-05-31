'use strict';

const EventEmitter = require('eventemitter3');
const request = require('superagent');

class MessengerBot extends EventEmitter{

    constructor(options){
        super();
        this.options = options;
    }

    _verify (req,res){
        if ( req.query['hub.verify_token'] === this.options.verify_token){
            res.status(200).send(req.query['hub.challenge']);
        } else{
            res.status(401).send({status:'error', error: 'Missing or wrong validation token!'});
        }
    }

    _processData (data){
        const entryList = data.entry;

        const processEntry = (entry) =>{
            const messagingList = entry.messaging;
            messagingList.forEach(processMessaging);
        };

        const processMessaging = (messaging) =>{
            const sender = messaging.sender;
            const message = messaging.message;
            const metadata = {
                timestamp: messaging.timestamp
            };

            if(messaging.postback){
                this.emit('postback', sender, messaging.postback, metadata);
            }

            if(messaging.optin){
                this.emit('auth', sender, messaging.optin, metadata);
            }

            if (message){

                if(message.attachments){
                    processAttachments(sender, message.attachments, metadata);
                }

                if(message.text){
                    this.emit('text', sender, message.text, metadata);
                }
            }

        };

        const processAttachments = (sender, attachments, metadata) =>{
            attachments.forEach( (attachment) =>{
                this.emit(attachment.type, sender, attachment, metadata);
            });
        };

        entryList.forEach(processEntry);
    }

    _sendResponse(type, recipient, data){
        const api_uri = `https://graph.facebook.com/v2.6/me/messages?access_token=${this.options.page_token}`;
        const send_response = (message) =>{
            request
                .post(api_uri)
                .send({ 'recipient' : recipient,
                        'message' : message
                      })
                .end(function(err, res){
                    if (res.error) console.log(res.error.text);
                });
        };

        switch (type){
        case 'text':
            send_response({'text': data.text});
            break;
        case 'image':
            send_response({
                "attachment":{
                    "type":"image",
                    "payload":{
                        "url": data.url
                    }
                }
            });
            break;
        case 'button':
            send_response({
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"button",
                        "text":data.text,
                        "buttons": data.buttons
                    }
                }
            });
            break;
        case 'generic':
            send_response({
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"generic",
                        "elements": data.elements
                    }
                }
            });
            break;
        case 'receipt':
            send_response({
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"receipt",
                        "recipient_name":data.recipient_name,
                        "order_number":data.order_number,
                        "currency":data.currency,
                        "payment_method":data.payment_method,
                        "order_url":data.order_url,
                        "timestamp":data.timestamp,
                        "elements": data.elements,
                        "address": data.address,
                        "summary": data.summary,
                        "adjustments": data.adjustments
                    }
                }
            });
            break;
        default:
            send_response({'text': 'Unexpected error'});
        }
    }

}

module.exports = MessengerBot;
