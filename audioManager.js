// 音频管理模块
class AudioManager {
    static playWordAudio(word, markAsLearned = false) {
        console.log('[播放音频] playWordAudio 被调用，word:', word, 'markAsLearned:', markAsLearned);
        
        // 检查浏览器是否支持语音合成
        if (window.speechSynthesis) {
            // 使用浏览器内置的语音合成
            this.playWordAudioNative(word, markAsLearned);
        } else {
            // 使用百度语音合成API作为替代方案
            this.playWordAudioBaidu(word, markAsLearned);
        }
    }

    static playWordAudioNative(word, markAsLearned = false) {
        // 检查可用的语音
        const voices = window.speechSynthesis.getVoices();
        console.log('[播放音频] 可用的语音数量:', voices.length);
        if (voices.length === 0) {
            console.warn('[播放音频] 警告：没有可用的语音，可能需要等待语音加载');
            // 尝试等待语音加载
            window.speechSynthesis.onvoiceschanged = () => {
                console.log('[播放音频] 语音已加载，重新尝试播放');
                this.playWordAudio(word, markAsLearned);
            };
            // 显示用户提示
            alert('正在加载语音，请稍后再试');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        
        // 设置语音
        const englishVoice = voices.find(v => v.lang.includes('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('[播放音频] 使用语音:', englishVoice.name);
        } else {
            console.warn('[播放音频] 警告：未找到英语语音，使用默认语音');
            // 使用第一个可用语音
            if (voices.length > 0) {
                utterance.voice = voices[0];
                console.log('[播放音频] 使用默认语音:', voices[0].name);
            }
        }
        
        // 监听播放事件
        utterance.onstart = () => {
            console.log('[播放音频] 开始播放');
        };
        
        utterance.onend = () => {
            console.log('[播放音频] 播放结束');
        };
        
        utterance.onerror = (event) => {
            console.error('[播放音频] 播放错误:', event.error);
            // 暂时禁用错误提示，只保留日志
            // if (event.error !== 'canceled' && event.error !== 'interrupted') {
            //     alert('语音播放失败，请检查浏览器设置');
            // }
        };
        
        // 开始高亮动画（延迟1秒以与发音同步）
        let currentTime = 1000; // 1秒延迟
        const letters = document.querySelectorAll('.letter');
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.add('highlight');
                setTimeout(() => {
                    letter.classList.remove('highlight');
                }, 200);
            }, currentTime);
            currentTime += 200;
        });
        
        try {
            // 确保语音合成未被暂停
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            
            window.speechSynthesis.speak(utterance);
            console.log('[播放音频] 已调用 speechSynthesis.speak');
        } catch (e) {
            console.error('[播放音频] 调用 speak 失败:', e);
            alert('语音播放失败，请检查浏览器设置');
        }
        
        // 只有在需要时才标记为已学
        if (markAsLearned) {
            try {
                DataManager.markWordAsLearned(currentUser, currentFile, word);
                // 更新统计显示
                updateStatsDisplay();
            } catch (e) {
                console.error('[播放音频] 标记已学失败:', e);
            }
        }
    }

    // 百度云语音合成服务
    static BaiduTTS = {
        // 直接使用获取到的token（有效期30天）
        token: '24.118c409ca7ab182ec6332e2421153d91.2592000.1775397635.282335-122258848',
        
        // 合成语音
        synthesize(text) {
            return new Promise((resolve, reject) => {
                try {
                    const url = 'https://tsn.baidu.com/text2audio';
                    const params = new URLSearchParams({
                        tex: encodeURIComponent(text),
                        lan: 'en',
                        tok: this.token,
                        ctp: 1,
                        cuid: 'web前端应用',
                        spd: 5,
                        pit: 5,
                        vol: 5,
                        per: 0
                    });
                    
                    // 直接创建Audio对象，避免CORS问题
                    const audioUrl = `${url}?${params.toString()}`;
                    const audio = new Audio(audioUrl);
                    
                    // 预加载音频
                    audio.preload = 'auto';
                    
                    audio.oncanplaythrough = () => {
                        resolve(audioUrl);
                    };
                    
                    audio.onerror = () => {
                        reject(new Error('音频加载失败'));
                    };
                    
                    // 开始加载
                    audio.load();
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // 播放语音
        async play(text) {
            try {
                const audioUrl = await this.synthesize(text);
                const audio = new Audio(audioUrl);
                
                // 播放音频
                return new Promise((resolve) => {
                    audio.onended = () => {
                        resolve(true);
                    };
                    
                    audio.onerror = () => {
                        console.error('播放失败: 音频播放错误');
                        resolve(false);
                    };
                    
                    audio.play().catch(error => {
                        console.error('播放失败:', error);
                        resolve(false);
                    });
                });
            } catch (error) {
                console.error('播放失败:', error);
                return false;
            }
        }
    };

    static async playWordAudioBaidu(word, markAsLearned = false) {
        console.log('[播放音频] 使用百度云语音合成API，word:', word);
        
        try {
            // 开始高亮动画
            let currentTime = 500; // 0.5秒延迟
            const letters = document.querySelectorAll('.letter');
            letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.classList.add('highlight');
                    setTimeout(() => {
                        letter.classList.remove('highlight');
                    }, 200);
                }, currentTime);
                currentTime += 200;
            });
            
            // 播放语音
            const success = await this.BaiduTTS.play(word);
            
            // 播放结束后标记为已学
            if (success && markAsLearned) {
                try {
                    DataManager.markWordAsLearned(currentUser, currentFile, word);
                    // 更新统计显示
                    updateStatsDisplay();
                } catch (e) {
                    console.error('[播放音频] 标记已学失败:', e);
                }
            }
            
        } catch (e) {
            console.error('[播放音频] 百度云API调用失败:', e);
            alert('语音播放失败，请检查网络连接或稍后再试');
        }
    }

    static playWordAudioTwice(word) {
        this.playWordAudio(word);
        setTimeout(() => {
            this.playWordAudio(word);
        }, 1500);
    }

    static playCurrentWordAudio() {
        const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
        if (currentWord) {
            this.playWordAudio(currentWord.word);
        }
    }

    static playPhoneticAudio() {
        const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
        if (currentWord) {
            this.playWordAudio(currentWord.word);
        }
    }

    static playExampleAudio() {
        const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
        if (currentWord && currentWord.example) {
            this.playWordAudio(currentWord.example);
        }
    }

    static playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.error('播放成功音效失败:', e);
        }
    }

    static playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.error('播放错误音效失败:', e);
        }
    }
}

// 导出AudioManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} else {
    window.AudioManager = AudioManager;
}