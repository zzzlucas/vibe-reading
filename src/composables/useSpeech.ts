import { ref, type Ref } from 'vue';
import { useAppStore } from '@/store/appStore';

export function useSpeech(inputValue: Ref<string>) {
  const store = useAppStore();
  const isListening = ref(false);
  let recognition: any = null;
  let savedTranscript = '';

  function toggleVoiceRecording() {
    if (isListening.value) {
      if (recognition) recognition.stop();
      isListening.value = false;
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      store.showToast('您的浏览器不支持原生的语音识别 API，推荐使用 Chrome 浏览器');
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        isListening.value = true;
        savedTranscript = inputValue.value ? inputValue.value + ' ' : '';
        store.showToast('🎙️ 正在聆听...', 'info');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let newlyFinal = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newlyFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        savedTranscript += newlyFinal;
        inputValue.value = savedTranscript + interimTranscript;
      };
      
      recognition.onerror = (e: any) => {
        store.showToast('语音识别异常: ' + e.error);
        isListening.value = false;
      };
      
      recognition.onend = () => {
        isListening.value = false;
      };
    }
    
    recognition.start();
  }

  return {
    isListening,
    toggleVoiceRecording
  };
}
