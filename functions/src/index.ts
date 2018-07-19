import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// init
admin.initializeApp(functions.config().firebase);
const bucket = admin.storage().bucket();

export const text2speech = functions.https.onRequest((request, response) => {
  // unsupport
  if (request.method === 'GET') {
    response.status(404).end();
    return;
  }
  console.log(functions.config());
  console.log('bucket', bucket);
  console.log(request.body);
  const { text, languageCode = 'ja-JP', ssmlGender = 'FEMALE', audioEncoding = 'MP3' } = request.body;

  const client: TextToSpeechClient = new TextToSpeechClient();
  const speechReq = {
    input: { text },
    voice: { languageCode, ssmlGender },
    audioConfig: { audioEncoding },
  };

  client.synthesizeSpeech(speechReq, async (err, res: any) => {
    if (err) {
      console.log(err);
      response.status(400).send(err).end();
      return;
    }

    const file = bucket.file(`${new Date().getTime()}.mp3`);
    // save file
    await file.save(res.audioContent);
    const signedURL = await file.getSignedUrl({ action: 'read' });

    response.status(200).send({
      signedURL
    });
  });
});
