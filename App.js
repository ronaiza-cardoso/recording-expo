import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { Audio } from "expo-av";
import * as Permissions from "expo-permissions";

import * as Sentry from 'sentry-expo';

const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};


export default function App () {
  const [recording, setRecording] = useState();
  const [isAllowRecord, setAllowRecord] = useState("No");
  const [recordingStatus, setRecordingStatus] = useState();

  useEffect(() => {
    Sentry.init({
      dsn: 'https://ce48b569a9b0442d883acb6dbac7ef0e@o369932.ingest.sentry.io/5429449',
      enableInExpoDevelopment: true,
      debug: true,
      enableNative: false
    });
  }, [])

  useEffect(() => {
    _askForPermissions();
  });

  async function _askForPermissions () {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    setAllowRecord(response.status);
  }

  async function _startRecording () {
   try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: true,
    }); 


    const newRerecording = new Audio.Recording();
    setRecording(newRerecording);

    await newRerecording.prepareToRecordAsync(RECORDING_OPTIONS);

    newRerecording.setOnRecordingStatusUpdate((status) =>
      setRecordingStatus(status)
    );

    await newRerecording.startAsync();
   } catch (error) {
    Sentry.captureMessage({
      type: 'useAudio -> _startRecording()',
      stringify: JSON.stringify(error),
      message: error.message,
    });
   }
  }

  async function _stopRecording () {
    if (!recording) {
      console.log("You are not recording.")
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      console.log(`Recorded URI: ${recording.getURI()}`);

      Sentry.captureMessage({
        type: 'useAudio -> stopRecord()',
        uri: recording.getURI(),
      });

    } catch (error) {
      Sentry.captureMessage({
        type: 'useAudio -> stopRecord()',
        stringify: JSON.stringify(error),
        message: error.message,
      });
    }
  }

  return (
    <View style={styles.container}>
      <Button title="start record" onPress={_startRecording} />
      <Button title="stop record" onPress={_stopRecording} />

      <View>
        <Text>Recording permission: {isAllowRecord} </Text>
        <Text style={{ fontSize: 15 }}>
          Can record: {recordingStatus?.canRecord ? "Yes" : "No"}
        </Text>
        <Text>Is recording: {recordingStatus?.isRecording ? "Yes" : "No"}</Text>
        <Text>
          Is done recording: {recordingStatus?.isDoneRecording ? "Yes" : "No"}
        </Text>
        <Text>Recording time: {recordingStatus?.durationMillis}</Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});