// 数据管理模块
class DataManager {
    static getUserData(user) {
        try {
            const userKey = `userStats_${user}`;
            const data = localStorage.getItem(userKey);
            return data ? JSON.parse(data) : {
                errorWords: [],
                today: {
                    date: new Date().toISOString().split('T')[0],
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                total: {
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                books: {}
            };
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return {
                errorWords: [],
                today: {
                    date: new Date().toISOString().split('T')[0],
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                total: {
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                books: {}
            };
        }
    }

    static saveUserData(user, data) {
        console.log('[DataManager] saveUserData 开始');
        console.log('[DataManager] user:', user);
        console.log('[DataManager] data:', data);
        try {
            const userKey = `userStats_${user}`;
            console.log('[DataManager] userKey:', userKey);
            localStorage.setItem(userKey, JSON.stringify(data));
            console.log('[DataManager] 数据保存成功');
            // 验证保存是否成功
            const savedData = localStorage.getItem(userKey);
            console.log('[DataManager] 验证保存结果:', savedData);
        } catch (error) {
            console.error('保存用户数据失败:', error);
        } finally {
            console.log('[DataManager] saveUserData 结束');
        }
    }

    static getErrorWords(user) {
        try {
            const userData = this.getUserData(user);
            return userData.errorWords || [];
        } catch (error) {
            console.error('获取错词本失败:', error);
            return [];
        }
    }

    static addErrorWord(user, word) {
        try {
            const userData = this.getUserData(user);
            const errorWords = userData.errorWords || [];
            
            // 检查单词是否已存在
            const exists = errorWords.some(w => w.word === word.word);
            if (!exists) {
                errorWords.push(word);
                userData.errorWords = errorWords;
                userData.today.error = (userData.today.error || 0) + 1;
                userData.total.error = (userData.total.error || 0) + 1;
                this.saveUserData(user, userData);
            }
        } catch (error) {
            console.error('添加错词失败:', error);
        }
    }

    static removeErrorWord(user, word) {
        try {
            const userData = this.getUserData(user);
            const errorWords = userData.errorWords || [];
            userData.errorWords = errorWords.filter(w => w.word !== word.word);
            this.saveUserData(user, userData);
        } catch (error) {
            console.error('移除错词失败:', error);
        }
    }

    static initBookData(user, bookFile, totalWords) {
        console.log('[DataManager] initBookData 开始');
        console.log('[DataManager] user:', user);
        console.log('[DataManager] bookFile:', bookFile);
        console.log('[DataManager] totalWords:', totalWords);
        try {
            // 直接从 localStorage 获取数据，避免缓存问题
            const userKey = `userStats_${user}`;
            let userData = localStorage.getItem(userKey);
            userData = userData ? JSON.parse(userData) : {
                errorWords: [],
                today: {
                    date: new Date().toISOString().split('T')[0],
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                total: {
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                books: {}
            };
            console.log('[DataManager] 从 localStorage 获取的 userData:', userData);
            
            // 确保 books 对象存在
            if (!userData.books) {
                userData.books = {};
                console.log('[DataManager] 创建 books 对象');
            }
            
            // 只有当课本数据不存在时才创建新的，避免重置已学单词数据
            if (!userData.books[bookFile]) {
                userData.books[bookFile] = {
                    totalWords: totalWords,
                    learnedWords: []
                };
                console.log('[DataManager] 创建课本数据:', bookFile);
                // 保存数据到 localStorage
                localStorage.setItem(userKey, JSON.stringify(userData));
                console.log('[DataManager] 保存课本数据成功');
            } else {
                // 如果课本数据已存在，只更新总单词数，保留已学单词数据
                const existingLearnedWords = userData.books[bookFile].learnedWords || [];
                userData.books[bookFile].totalWords = totalWords;
                // 确保 learnedWords 是数组
                if (!Array.isArray(userData.books[bookFile].learnedWords)) {
                    userData.books[bookFile].learnedWords = existingLearnedWords;
                    console.log('[DataManager] 确保 learnedWords 是数组:', existingLearnedWords);
                }
                console.log('[DataManager] 更新课本总单词数:', totalWords);
                console.log('[DataManager] 保留已学单词数据:', userData.books[bookFile].learnedWords);
                // 保存数据到 localStorage
                localStorage.setItem(userKey, JSON.stringify(userData));
                console.log('[DataManager] 保存课本数据成功');
            }
            
            console.log('[DataManager] initBookData 结束');
            return userData.books[bookFile];
        } catch (error) {
            console.error('初始化课本数据失败:', error);
            return null;
        }
    }

    static markWordAsLearned(user, bookFile, word) {
        console.log('[DataManager] markWordAsLearned 开始');
        console.log('[DataManager] user:', user);
        console.log('[DataManager] bookFile:', bookFile);
        console.log('[DataManager] word:', word);
        try {
            // 直接从 localStorage 获取数据，避免缓存问题
            const userKey = `userStats_${user}`;
            let userData = localStorage.getItem(userKey);
            userData = userData ? JSON.parse(userData) : {
                errorWords: [],
                today: {
                    date: new Date().toISOString().split('T')[0],
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                total: {
                    learning: 0,
                    testing: 0,
                    correct: 0,
                    error: 0
                },
                books: {}
            };
            console.log('[DataManager] 从 localStorage 获取的 userData:', userData);
            
            // 确保 books 对象存在
            if (!userData.books) {
                userData.books = {};
                console.log('[DataManager] 创建 books 对象');
            }
            
            // 确保当前课本数据存在
            if (!userData.books[bookFile]) {
                userData.books[bookFile] = {
                    totalWords: 0,
                    learnedWords: []
                };
                console.log('[DataManager] 创建课本数据:', bookFile);
            }
            
            // 确保已学单词列表存在且是数组
            if (!Array.isArray(userData.books[bookFile].learnedWords)) {
                userData.books[bookFile].learnedWords = [];
                console.log('[DataManager] 创建 learnedWords 列表');
            }
            
            // 检查单词是否已经在已学列表中
            const wordLower = word.toLowerCase();
            console.log('[DataManager] wordLower:', wordLower);
            console.log('[DataManager] 已学单词列表:', userData.books[bookFile].learnedWords);
            
            // 强制添加单词到已学列表，确保数据正确
            if (!userData.books[bookFile].learnedWords.includes(wordLower)) {
                userData.books[bookFile].learnedWords.push(wordLower);
                userData.today.learning = (userData.today.learning || 0) + 1;
                userData.total.learning = (userData.total.learning || 0) + 1;
                console.log('[DataManager] 添加单词到已学列表:', wordLower);
                console.log('[DataManager] 今日学习次数:', userData.today.learning);
                console.log('[DataManager] 累计学习次数:', userData.total.learning);
            } else {
                console.log('[DataManager] 单词已经在已学列表中:', wordLower);
            }
            
            // 无论单词是否已存在，都保存数据到 localStorage，确保数据同步
            console.log('[DataManager] 保存数据到 localStorage');
            console.log('[DataManager] 保存前的 userData:', userData);
            localStorage.setItem(userKey, JSON.stringify(userData));
            console.log('[DataManager] 保存成功');
            
            // 验证保存结果
            const savedData = localStorage.getItem(userKey);
            console.log('[DataManager] 验证保存结果:', savedData);
            const parsedSavedData = JSON.parse(savedData);
            console.log('[DataManager] 解析后的保存结果:', parsedSavedData);
            
            console.log('[DataManager] markWordAsLearned 结束');
            return userData.books[bookFile];
        } catch (error) {
            console.error('标记单词为已学失败:', error);
            return null;
        }
    }

    static getLearnedWordsCount(user, bookFile) {
        console.log('[DataManager] getLearnedWordsCount 开始');
        console.log('[DataManager] user:', user);
        console.log('[DataManager] bookFile:', bookFile);
        try {
            // 直接从 localStorage 获取数据，避免缓存问题
            const userKey = `userStats_${user}`;
            const savedData = localStorage.getItem(userKey);
            console.log('[DataManager] 从 localStorage 获取的 savedData:', savedData);
            const userData = savedData ? JSON.parse(savedData) : {
                books: {}
            };
            console.log('[DataManager] userData:', userData);
            console.log('[DataManager] userData.books:', userData.books);
            
            // 检查数据结构是否完整
            if (userData && userData.books && userData.books[bookFile]) {
                console.log('[DataManager] 课本数据存在:', userData.books[bookFile]);
                // 确保 learnedWords 是数组
                if (Array.isArray(userData.books[bookFile].learnedWords)) {
                    console.log('[DataManager] learnedWords:', userData.books[bookFile].learnedWords);
                    console.log('[DataManager] learnedWords.length:', userData.books[bookFile].learnedWords.length);
                    return userData.books[bookFile].learnedWords.length;
                } else {
                    console.log('[DataManager] learnedWords 不是数组，重置为[]');
                    // 如果 learnedWords 不是数组，重置为[]
                    userData.books[bookFile].learnedWords = [];
                    localStorage.setItem(userKey, JSON.stringify(userData));
                    console.log('[DataManager] 重置 learnedWords 为[]并保存');
                    return 0;
                }
            }
            console.log('[DataManager] 未找到已学单词数据');
            return 0;
        } catch (error) {
            console.error('获取已学单词数量失败:', error);
            return 0;
        }
    }

    static getBookData(user, bookFile) {
        try {
            const userData = this.getUserData(user);
            if (userData && userData.books && userData.books[bookFile]) {
                return userData.books[bookFile];
            }
            // 如果课本数据不存在，尝试从localStorage直接获取
            const userKey = `userStats_${user}`;
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData && parsedData.books && parsedData.books[bookFile]) {
                    return parsedData.books[bookFile];
                }
            }
            return null;
        } catch (error) {
            console.error('获取课本数据失败:', error);
            return null;
        }
    }
}

// 导出DataManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
}