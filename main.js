// 主应用模块

// 全局变量
let currentUser = 'youyou';
let currentUserName = '悠悠';
let currentFile = '3下.pdf';
let currentBookName = '三年级下册';
let words = [];
let currentUnit = 'all';
let maskMode = 'none';
let errorBookMaskMode = 'none';
let userStats = {};
let currentWordIndex = 0;
let currentStep = 'learn';
let isErrorBookMode = false;
let errorWords = [];

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 检查并加载用户信息
    checkUserInfo();
    
    // 加载用户最近学习的课本或默认课本
    loadUserBook();
    
    // 加载用户数据
    await loadUserStats();
    
    // 加载PDF
    await loadPDF();
    
    // 初始化事件监听
    initEventListeners();
});

// 检查用户信息
function checkUserInfo() {
    // 从localStorage获取用户信息
    const savedUser = localStorage.getItem('currentUser');
    const savedUserName = localStorage.getItem('currentUserName');
    
    if (savedUser && savedUserName) {
        // 使用存储的用户信息
        currentUser = savedUser;
        currentUserName = savedUserName;
        
        // 更新UI上的用户名称显示
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${currentUserName}，快来学单词吧！加油哦！`;
        }
        
        const currentUserDisplayElement = document.getElementById('currentUserDisplay');
        if (currentUserDisplayElement) {
            currentUserDisplayElement.textContent = currentUserName;
        }
        
        return true;
    } else {
        // 显示用户选择弹窗
        document.getElementById('userModal').classList.add('active');
        return false;
    }
}

// 带用户检查的函数包装器
function withUserCheck(func) {
    return function() {
        if (checkUserInfo()) {
            func.apply(this, arguments);
        }
    };
}

// 初始化事件监听
function initEventListeners() {
    // 单元标签切换
    const unitTabs = document.getElementById('unitTabs');
    if (unitTabs) {
        unitTabs.addEventListener('click', function(e) {
            if (e.target.classList.contains('unit-tab')) {
                document.querySelectorAll('.unit-tab').forEach(tab => tab.classList.remove('active'));
                e.target.classList.add('active');
                currentUnit = e.target.dataset.unit;
                renderWordList();
            }
        });
    }
    
    // 遮罩模式切换
    const maskModeButtons = document.querySelectorAll('.mask-mode');
    if (maskModeButtons.length > 0) {
        maskModeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.mask-mode').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const mode = this.dataset.mode;
                
                // 检查当前页面，使用对应的遮罩模式变量
                const wordListPage = document.getElementById('wordListPage');
                const errorBookPage = document.getElementById('errorBookPage');
                
                if (wordListPage && wordListPage.classList.contains('active')) {
                    maskMode = mode;
                    renderWordList();
                } else if (errorBookPage && errorBookPage.classList.contains('active')) {
                    errorBookMaskMode = mode;
                    renderErrorWordList();
                }
            });
        });
    }
    
    // 课本选择
    document.querySelectorAll('.book-option').forEach(option => {
        option.addEventListener('click', function() {
            currentFile = this.dataset.file;
            currentBookName = this.dataset.name;
            updateBookDisplay();
            // 保存用户选择的课本
            saveUserBook();
            closeBookModal();
            loadPDF();
        });
    });
    
    // 用户选择
    document.querySelectorAll('.user-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.user-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            currentUser = this.dataset.user;
            currentUserName = this.textContent;
            loadUserStats();
        });
    });
    
    // 底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 筛选下拉框
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            renderWordList();
        });
    }
}

// 更新教材显示
function updateBookDisplay() {
    // 检查是否为7年级及以上教材
    const isPeopleEdition = currentFile && parseInt(currentFile[0]) >= 7;
    const bookPrefix = isPeopleEdition ? '人教版' : '外研版Join In';
    
    // 只在元素存在时才设置textContent
    const bookTitle = document.getElementById('bookTitle');
    if (bookTitle) {
        bookTitle.textContent = `${bookPrefix}-${currentBookName}`;
    }
    
    const bookGrade = document.getElementById('bookGrade');
    if (bookGrade) {
        bookGrade.textContent = currentBookName.replace('年级', '年级 ').replace('上册', '上册').replace('下册', '下册');
    }
    
    const listTitle = document.getElementById('listTitle');
    if (listTitle) {
        listTitle.textContent = `${bookPrefix}-${currentBookName}`;
    }
    
    const linkTitle = document.getElementById('linkTitle');
    if (linkTitle) {
        linkTitle.textContent = `${bookPrefix}-${currentBookName}`;
    }
}

// 显示课本选择弹窗
function showBookModal() {
    document.getElementById('bookModal').classList.add('active');
}

// 关闭课本选择弹窗
function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
}

// 显示用户选择弹窗
function showUserModal() {
    document.getElementById('userModal').classList.add('active');
}

// 关闭用户选择弹窗
async function closeUserModal() {
    const selectedOption = document.querySelector('.user-option.selected');
    if (selectedOption) {
        currentUser = selectedOption.dataset.user;
        currentUserName = selectedOption.textContent;
        
        // 保存用户信息到localStorage
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('currentUserName', currentUserName);
        
        // 清除该用户的课本信息，确保使用默认课本
        const bookKey = `userBook_${currentUser}`;
        localStorage.removeItem(bookKey);
        
        // 加载用户默认课本
        loadUserBook();
        
        // 保存当前课本信息到localStorage
        const bookData = {
            file: currentFile,
            name: currentBookName
        };
        localStorage.setItem(bookKey, JSON.stringify(bookData));
        
        // 更新UI上的用户名称显示
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${currentUserName}，快来学单词吧！加油哦！`;
        }
        
        const currentUserDisplayElement = document.getElementById('currentUserDisplay');
        if (currentUserDisplayElement) {
            currentUserDisplayElement.textContent = currentUserName;
        }
        
        // 加载用户统计数据
        await loadUserStats();
        
        // 加载单词数据
        await loadPDF();
    }
    document.getElementById('userModal').classList.remove('active');
}

// 开始学习 - 进入单词列表页
function startLearning() {
    window.location.href = 'word-list.html';
}

// 开始详细学习 - 进入单词学习页面
function startDetailedLearning() {
    window.location.href = 'word-link.html?index=0';
}

// 返回首页
function backToHome() {
    window.location.href = 'index.html';
}

// 生成单元标签
function generateUnitTabs() {
    const tabsContainer = document.getElementById('unitTabs');
    tabsContainer.innerHTML = '';
}

// 渲染单词列表
function renderWordList() {
    const listContainer = document.getElementById('wordList');
    if (!listContainer) return;
    
    let filteredWords = words;
    
    // 按单元筛选
    if (currentUnit !== 'all') {
        filteredWords = filteredWords.filter(w => w.unit === currentUnit);
    }
    
    listContainer.innerHTML = filteredWords.map((word, index) => {
        return `
        <div class="word-item" data-index="${index}" onclick="openWordLinkPage(${index})"><div class="word-index">
                ${index + 1}
            </div>
            <div class="word-info">
                <div class="word-text ${maskMode === 'word' ? 'masked' : ''}" ${maskMode === 'word' ? 'onclick="this.classList.remove(\'masked\'); event.stopPropagation();"' : ''}>${word.word}</div>
                <div class="word-phonetic">${word.phonetic || ''}</div>
            </div>
            <div class="word-meaning ${maskMode === 'meaning' ? 'masked' : ''}" ${maskMode === 'meaning' ? 'onclick="this.classList.remove(\'masked\'); event.stopPropagation();"' : ''}>${word.meaning}</div>
            <div class="word-actions">
                <button class="action-btn" onclick="AudioManager.playWordAudio('${word.word}', true); event.stopPropagation();">🔊</button>
            </div>
        </div>
        `;
    }).join('');
    
    // 为错词本列表也添加序号
    const errorListContainer = document.getElementById('errorWordList');
    if (errorListContainer) {
        const errorWords = DataManager.getErrorWords(currentUser);
        errorListContainer.innerHTML = errorWords.map((word, index) => {
            return `
            <div class="word-item" data-index="${index}" onclick="openErrorWordLinkPage(${index})"><div class="word-index">
                    ${index + 1}
                </div>
                <div class="word-info">
                    <div class="word-text">${word.word}</div>
                    <div class="word-phonetic">${word.phonetic || ''}</div>
                </div>
                <div class="word-meaning">${word.meaning}</div>
                <div class="word-actions">
                    <button class="action-btn" onclick="AudioManager.playWordAudio('${word.word}', true); event.stopPropagation();">🔊</button>
                </div>
            </div>
            `;
        }).join('');
    }
}

// 加载用户统计数据
async function loadUserStats() {
    console.log('[加载用户统计数据] 开始');
    console.log('[加载用户统计数据] currentUser:', currentUser);
    try {
        const userKey = `userStats_${currentUser}`;
        console.log('[加载用户统计数据] userKey:', userKey);
        const savedStats = localStorage.getItem(userKey);
        console.log('[加载用户统计数据] savedStats:', savedStats);
        
        if (savedStats) {
            userStats = JSON.parse(savedStats);
            console.log('[加载用户统计数据] 解析后的用户数据:', userStats);
        } else {
            // 使用DataManager的默认数据结构，确保包含books字段
            userStats = {
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
            console.log('[加载用户统计数据] 创建默认用户数据:', userStats);
        }
        
        // 更新统计显示
        updateStatsDisplay();
        
    } catch (error) {
        console.error('加载用户统计数据失败:', error);
    } finally {
        console.log('[加载用户统计数据] 结束');
    }
}

// 加载用户最近学习的课本
function loadUserBook() {
    console.log('[加载用户课本] 开始');
    try {
        const bookKey = `userBook_${currentUser}`;
        console.log('[加载用户课本] bookKey:', bookKey);
        const savedBook = localStorage.getItem(bookKey);
        console.log('[加载用户课本] savedBook:', savedBook);
        
        if (savedBook) {
            const bookData = JSON.parse(savedBook);
            currentFile = bookData.file;
            currentBookName = bookData.name;
            console.log('[加载用户课本] 加载用户保存的课本:', currentFile, currentBookName);
        } else {
            // 根据用户设置默认课本
            switch (currentUser) {
                case 'qiuqiu':
                    currentFile = '7下.pdf';
                    currentBookName = '七年级下册';
                    break;
                case 'youyou':
                    currentFile = '5下.pdf';
                    currentBookName = '五年级下册';
                    break;
                case 'diandian':
                    currentFile = '3上.pdf';
                    currentBookName = '三年级上册';
                    break;
                default:
                    currentFile = '3下.pdf';
                    currentBookName = '三年级下册';
            }
            console.log('[加载用户课本] 加载用户默认课本:', currentFile, currentBookName);
        }
        updateBookDisplay();
    } catch (error) {
        console.error('加载用户课本失败:', error);
        // 发生错误时根据用户设置默认课本
        switch (currentUser) {
            case 'qiuqiu':
                currentFile = '7下.pdf';
                currentBookName = '七年级下册';
                break;
            case 'youyou':
                currentFile = '5下.pdf';
                currentBookName = '五年级下册';
                break;
            case 'diandian':
                currentFile = '3上.pdf';
                currentBookName = '三年级上册';
                break;
            default:
                currentFile = '3下.pdf';
                currentBookName = '三年级下册';
        }
        console.log('加载默认课本（错误处理）:', currentFile, currentBookName);
        updateBookDisplay();
    } finally {
        console.log('[加载用户课本] 结束');
    }
}

// 保存用户选择的课本
function saveUserBook() {
    try {
        const bookKey = `userBook_${currentUser}`;
        const bookData = {
            file: currentFile,
            name: currentBookName
        };
        localStorage.setItem(bookKey, JSON.stringify(bookData));
    } catch (error) {
        console.error('保存用户课本失败:', error);
    }
}

// 更新统计显示
function updateStatsDisplay() {
    console.log('[更新统计显示] 开始');
    console.log('[更新统计显示] currentUser:', currentUser);
    console.log('[更新统计显示] currentFile:', currentFile);
    console.log('[更新统计显示] words.length:', words.length);
    
    // 检查元素是否存在
    const totalWordsElement = document.getElementById('totalWords');
    const learnedWordsElement = document.getElementById('learnedWords');
    
    console.log('[更新统计显示] totalWordsElement:', totalWordsElement);
    console.log('[更新统计显示] learnedWordsElement:', learnedWordsElement);
    
    // 只有当元素存在时才更新
    if (totalWordsElement) {
        // 优先从DataManager获取总单词数，避免words数组未加载的问题
        let totalCount = words.length;
        const bookData = DataManager.getBookData(currentUser, currentFile);
        if (bookData && bookData.totalWords) {
            totalCount = bookData.totalWords;
        }
        totalWordsElement.textContent = totalCount;
        console.log('[更新统计显示] 单词总数:', totalCount);
    }
    
    if (learnedWordsElement) {
        const learnedCount = DataManager.getLearnedWordsCount(currentUser, currentFile);
        console.log('[更新统计显示] 已学单词数量:', learnedCount);
        learnedWordsElement.textContent = learnedCount;
    }
    console.log('[更新统计显示] 结束');
}

// 更新统计页面显示
function updateStatsPage() {
    // 更新日期
    const statsDateElement = document.getElementById('statsDate');
    if (statsDateElement) {
        const today = new Date().toISOString().split('T')[0];
        statsDateElement.textContent = today;
    }
    
    // 获取用户数据
    const userData = DataManager.getUserData(currentUser);
    
    // 更新今日统计
    const todayCompletedElement = document.getElementById('todayCompleted');
    const todayErrorElement = document.getElementById('todayError');
    
    if (todayCompletedElement) {
        todayCompletedElement.textContent = userData.today.learning || 0;
    }
    
    if (todayErrorElement) {
        todayErrorElement.textContent = userData.today.error || 0;
    }
    
    // 更新累计统计
    const totalCompletedElement = document.getElementById('totalCompleted');
    const totalErrorElement = document.getElementById('totalError');
    
    if (totalCompletedElement) {
        totalCompletedElement.textContent = userData.total.learning || 0;
    }
    
    if (totalErrorElement) {
        totalErrorElement.textContent = userData.total.error || 0;
    }
}

// 加载单词数据
async function loadPDF() {
    console.log('[加载单词数据] 开始');
    console.log('[加载单词数据] currentFile:', currentFile);
    console.log('[加载单词数据] currentUser:', currentUser);
    showLoading();
    const pdfPath = currentFile;
    const jsonPath = pdfPath.replace('.pdf', '.json');
    console.log('[加载单词数据] pdfPath:', pdfPath);
    console.log('[加载单词数据] jsonPath:', jsonPath);
    
    try {
        // 尝试加载JSON文件
        const response = await fetch(jsonPath);
        console.log('[加载单词数据] JSON文件响应状态:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('[加载单词数据] JSON加载成功，单词数量:', data.length);
            words = data;
            console.log('[加载单词数据] 初始化课本数据');
            // 初始化课本数据
            DataManager.initBookData(currentUser, currentFile, words.length);
            console.log('[加载单词数据] 更新统计显示');
            updateStatsDisplay();
            console.log('[加载单词数据] 渲染单词列表');
            renderWordList();
        } else {
            throw new Error('JSON文件不存在或无法加载');
        }
    } catch (error) {
        console.error('加载JSON失败:', error);
        // 回退到PDF加载
        console.log('回退到PDF加载:', pdfPath);
        await loadPDFOriginal();
    } finally {
        hideLoading();
        console.log('[加载单词数据] 结束');
    }
}

// 原始PDF加载函数
async function loadPDFOriginal() {
    // 初始化 PDF.js
    if (!initPdfJs()) {
        console.error('PDF.js 库未加载，使用模拟数据');
        loadMockData();
        return;
    }
    
    try {
        const pdf = await pdfjsLib.getDocument({ 
            url: currentFile, 
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true
        }).promise;
        
        // console.log('PDF加载成功，页数:', pdf.numPages);
        await processPDF(pdf);
    } catch (error) {
        console.error('加载PDF失败:', error);
        // 使用模拟数据
        loadMockData();
    }
}

// 显示加载中
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

// 隐藏加载中
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// 初始化 PDF.js
function initPdfJs() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        console.log('[PDF.js] 初始化成功');
        return true;
    }
    console.warn('[PDF.js] 库未加载');
    return false;
}

// 处理PDF文档
function processPDF(pdf) {
    let pages = [];
    
    // 遍历所有页面
    for (let i = 1; i <= pdf.numPages; i++) {
        pages.push(pdf.getPage(i));
    }
    
    Promise.all(pages).then(function(pageList) {
        // console.log('获取页面成功，页面数:', pageList.length);
        let contentPromises = pageList.map(page => page.getTextContent());
        
        Promise.all(contentPromises).then(function(contentList) {
            // console.log('获取文本内容成功，页面数:', contentList.length);
            words = [];  // 重置单词列表
            
            // 解析每个页面的内容
            contentList.forEach((content, pageIndex) => {
                // console.log(`解析页面 ${pageIndex + 1} 的内容`);
                // console.log('原始文本项:', content.items.length);
                
                // 按行组织文本
                let lines = [];
                let currentLine = [];
                let lastY = null;
                
                // 按y坐标分组文本，使用更小的阈值确保同一行的文本被正确合并
                content.items.forEach((item, index) => {
                    // 只输出前几个文本项的信息，避免日志过多
                    if (index < 5) {
                        // console.log(`文本项 ${index}:`, item);
                    }
                    const y = item.transform[5];
                    if (lastY === null || Math.abs(y - lastY) > 0.5) {
                        if (currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = [];
                        }
                        lastY = y;
                    }
                    currentLine.push(item);
                });
                
                // 处理小方格，确保它单独作为一列
                lines = lines.map(line => {
                    const newLine = [];
                    line.forEach(item => {
                        if (item.str === '□') {
                            // 小方格单独作为一列
                            newLine.push(item);
                        } else {
                            newLine.push(item);
                        }
                    });
                    return newLine;
                });
                
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                
                // console.log(`页面 ${pageIndex + 1} 行数:`, lines.length);
                
                // 按x坐标排序每行的文本
                lines.forEach(line => {
                    line.sort((a, b) => a.transform[4] - b.transform[4]);
                });
                
                // 打印每行内容
                lines.forEach((line, lineIndex) => {
                    const lineText = line.map(item => item.str).join(' ');
                    // console.log(`页面 ${pageIndex + 1} 行 ${lineIndex + 1}:`, lineText);
                });
                
                // 寻找表格开始位置 - 找到第一个以数字序号为第一列的行
                let tableStartIndex = -1;
                // console.log(`页面 ${pageIndex + 1} 开始寻找表格，共 ${lines.length} 行`);
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // 获取整行文本
                    const lineText = line.map(item => item.str).join(' ').trim();
                    // console.log(`页面 ${pageIndex + 1} 行 ${i + 1} 内容: "${lineText}"`);
                    
                    // 检查行内容是否以数字序号开头（如"1", "250"）
                    // 匹配行首的数字，后面可以跟空格、字母或结束
                    const match = lineText.match(/^(\d+)(\s|$)/);
                    if (match) {
                        const firstNumber = match[1];
                        tableStartIndex = i;
                        // console.log(`页面 ${pageIndex + 1} 表格开始行:`, tableStartIndex + 1, `(找到序号: ${firstNumber})`);
                        break;
                    }
                }
                
                // 从表格的第一行开始读取（包含序号行）
                if (tableStartIndex !== -1) {
                    // console.log(`开始处理表格，表格开始行: ${tableStartIndex + 1}`);
                    // 存储单词信息，用于处理跨行的数据
                    let currentWord = null;
                    let currentPhonetic = null;
                    let currentMeaning = null;
                    let currentNumber = null;
                    
                    // console.log(`开始遍历表格行，共 ${lines.length - tableStartIndex} 行`);
                    
                    // 重新组织行数据，确保序号、单词、音标和释义正确对应
                    let wordLines = [];
                    let currentEntry = null;
                    
                    for (let i = tableStartIndex; i < lines.length; i++) {
                        const line = lines[i];
                        const lineText = line.map(item => item.str).join(' ').trim();
                        // console.log(`处理行 ${i + 1}，内容: "${lineText}"`);
                        
                        // 检查是否为数字序号行（匹配行首的数字）
                        const numberMatch = lineText.match(/^(\d+)(\s|$)/);
                        if (numberMatch) {
                            const firstItem = numberMatch[1];
                                // 这是新的单词序号行
                                if (currentEntry && currentEntry.number) {
                                    wordLines.push(currentEntry);
                                    // console.log(`保存上一个单词条目:`, currentEntry);
                                }
                                currentEntry = { number: firstItem, word: '', phonetic: '', meaning: '' };
                                // console.log(`识别到新单词序号: ${firstItem}`);
                                
                                // 检查当前行是否有单词（有些PDF序号和单词在同一行）
                                if (line.length > 1) {
                                    const remainingText = line.slice(1).map(item => item.str).join(' ').trim();
                                    // console.log(`序号行剩余内容: "${remainingText}"`);
                                    // 确保剩余内容不是纯数字（避免把序号当成单词）
                                    if (remainingText && !remainingText.includes('/') && !remainingText.includes('[') && !/^\d+$/.test(remainingText)) {
                                        currentEntry.word = remainingText;
                                        // console.log(`从序号行提取单词: "${currentEntry.word}"`);
                                    }
                                }
                            } else if (currentEntry && currentEntry.number) {
                                // 这是当前单词的后续行
                                // console.log(`处理单词 ${currentEntry.number} 的后续行`);
                                
                                // 检查是否为音标行
                                if (lineText.includes('/') || lineText.includes('[')) {
                                    currentEntry.phonetic = lineText;
                                    // console.log(`提取音标: "${currentEntry.phonetic}"`);
                                } else if (lineText) {
                                    // 移除小方格后处理
                                    const cleanedText = lineText.replace(/□/g, '').trim();
                                    if (cleanedText) {
                                        // 如果还没有单词，这行可能是单词
                                        if (!currentEntry.word) {
                                            currentEntry.word = cleanedText;
                                            // console.log(`提取单词: "${currentEntry.word}"`);
                                        } else {
                                            // 这是释义行
                                            if (currentEntry.meaning) {
                                                currentEntry.meaning += ' ' + cleanedText;
                                            } else {
                                                currentEntry.meaning = cleanedText;
                                            }
                                            // console.log(`提取释义: "${currentEntry.meaning}"`);
                                        }
                                    }
                                }
                            }
                    }
                    
                    // 添加最后一个单词
                    if (currentEntry && currentEntry.number) {
                        wordLines.push(currentEntry);
                        // console.log(`保存最后一个单词条目:`, currentEntry);
                    }
                    
                    // console.log(`识别到 ${wordLines.length} 个单词条目`);
                    // console.log(`单词条目:`, wordLines);
                    
                    // 转换为单词列表并添加到总列表
                    wordLines.forEach((entry, index) => {
                        // 清理单词：区分单词内部空格和词组空格
                        let cleanWord = (entry.word || '').trim();
                        // 检查是否为单词内部空格（如"sch oo l"或"u n t i l"）
                        if (cleanWord.includes(' ') && !cleanWord.includes('-') && !cleanWord.includes('\'') && cleanWord.split(' ').every(part => part.length === 1)) {
                            // 单词内部空格，移除空格
                            cleanWord = cleanWord.replace(/\s+/g, '');
                        }
                        
                        const word = {
                            word: cleanWord,
                            phonetic: (entry.phonetic || '').trim(),
                            meaning: (entry.meaning || '').trim().replace(/□/g, '').trim(),
                            unit: 'all' // 默认单元
                        };
                        
                        if (word.word) {
                            words.push(word);
                        }
                    });
                }
            });
            
            // console.log('最终单词列表:', words);
            // console.log('单词数量:', words.length);
            
            // 初始化课本数据
            DataManager.initBookData(currentUser, currentFile, words.length);
            
            // 更新统计显示
            updateStatsDisplay();
            
            // 渲染单词列表
            renderWordList();
        });
    });
}

// 使用模拟数据
function loadMockData() {
    words = [
        { word: 'apple', phonetic: '/ˈæpl/', meaning: 'n. 苹果' },
        { word: 'banana', phonetic: '/bəˈnɑːnə/', meaning: 'n. 香蕉' },
        { word: 'cat', phonetic: '/kæt/', meaning: 'n. 猫' },
        { word: 'dog', phonetic: '/dɒɡ/', meaning: 'n. 狗' },
        { word: 'elephant', phonetic: '/ˈelɪfənt/', meaning: 'n. 大象' }
    ];
    
    // 更新统计显示
    updateStatsDisplay();
    
    // 渲染单词列表
    renderWordList();
}

// 打开单词链路页面
function openWordLinkPage(index) {
    window.location.href = `word-link.html?index=${index}`;
}

// 生成单词链条
function generateWordChain() {
    const chainContainer = document.getElementById('wordChain');
    chainContainer.innerHTML = '';
    
    words.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'chain-word-item';
        
        const wordText = document.createElement('div');
        wordText.className = 'chain-word';
        wordText.id = `chain-word-${index}`;
        
        if (index === currentWordIndex) {
            wordText.classList.add('current');
        } else if (index < currentWordIndex) {
            wordText.classList.add('completed');
        } else {
            wordText.classList.add('pending');
        }
        
        // 在拼和写步骤中遮挡当前学习的单词
        if ((currentStep === 'spell' || currentStep === 'write') && index === currentWordIndex) {
            wordText.textContent = '**';
        } else {
            wordText.textContent = word.word;
        }
        wordText.onclick = () => openWordLinkPage(index);
        
        const wordIndex = document.createElement('div');
        wordIndex.className = 'chain-word-index';
        wordIndex.textContent = index + 1;
        
        wordElement.appendChild(wordText);
        wordElement.appendChild(wordIndex);
        chainContainer.appendChild(wordElement);
    });
    
    // 滚动到当前单词位置
    setTimeout(() => {
        const currentElement = document.getElementById(`chain-word-${currentWordIndex}`);
        if (currentElement) {
            currentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, 100);
}

// 更新学习内容
function updateLearningContent() {
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;
    
    // 更新学页面
    const wordLetters = document.getElementById('wordLetters');
    if (wordLetters) {
        wordLetters.innerHTML = '';
        for (let i = 0; i < currentWord.word.length; i++) {
            const char = currentWord.word[i];
            if (char === ' ') {
                const space = document.createElement('span');
                space.className = 'letter-space';
                space.textContent = ' ';
                space.style.width = '12px';
                wordLetters.appendChild(space);
            } else {
                const letter = document.createElement('span');
                letter.className = 'letter';
                letter.textContent = char;
                const colorCode = getPhoneticColor(char, i, currentWord.word);
                switch (colorCode) {
                    case 'r':
                        letter.style.color = '#e74c3c';
                        break;
                    case 'b':
                        letter.style.color = '#3498db';
                        break;
                    case 'g':
                        letter.style.color = '#2ecc71';
                        break;
                    default:
                        letter.style.color = '#333333';
                }
                wordLetters.appendChild(letter);
            }
        }
    }
    
    const phoneticWrapper = document.getElementById('phoneticWrapper');
    if (phoneticWrapper) {
        phoneticWrapper.textContent = currentWord.phonetic || '';
    }
    
    const learnMeaning = document.getElementById('learnMeaning');
    if (learnMeaning) {
        learnMeaning.textContent = currentWord.meaning;
    }
    
    // 更新读页面
    const readWord = document.getElementById('readWord');
    if (readWord) {
        readWord.textContent = currentWord.word;
    }
    
    const readPhonetic = document.getElementById('readPhonetic');
    if (readPhonetic) {
        readPhonetic.textContent = currentWord.phonetic || '';
    }
    
    // 更新拼页面
    const spellWord = document.getElementById('spellWord');
    if (spellWord) {
        spellWord.textContent = currentWord.word;
    }
    
    const spellInputs = document.getElementById('spellInputs');
    if (spellInputs) {
        spellInputs.innerHTML = '';
        for (let i = 0; i < currentWord.word.length; i++) {
            const inputBox = document.createElement('div');
            inputBox.className = 'spell-input-box';
            inputBox.dataset.index = i;
            inputBox.onclick = () => removeLetter(i);
            spellInputs.appendChild(inputBox);
        }
    }
    
    const spellPhonetic = document.getElementById('spellPhonetic');
    if (spellPhonetic) {
        spellPhonetic.textContent = currentWord.phonetic || '';
    }
    
    const spellLetters = document.getElementById('spellLetters');
    if (spellLetters) {
        spellLetters.innerHTML = '';
        const letters = currentWord.word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        letters.forEach((letter, index) => {
            const letterButton = document.createElement('div');
            letterButton.className = 'spell-letter';
            letterButton.textContent = letter;
            letterButton.onclick = () => addLetter(letter);
            spellLetters.appendChild(letterButton);
        });
    }
    
    // 更新写页面
    const writeWord = document.getElementById('writeWord');
    if (writeWord) {
        writeWord.textContent = currentWord.word;
    }
    
    const writePhonetic = document.getElementById('writePhonetic');
    if (writePhonetic) {
        writePhonetic.textContent = currentWord.phonetic || '';
    }
    
    const writeMeaning = document.getElementById('writeMeaning');
    if (writeMeaning) {
        writeMeaning.textContent = currentWord.meaning;
    }
    
    const writeInput = document.getElementById('writeInput');
    if (writeInput) {
        writeInput.value = '';
    }
    
    const writeResult = document.getElementById('writeResult');
    if (writeResult) {
        writeResult.textContent = '';
        writeResult.classList.remove('correct', 'incorrect');
    }
    
    // 更新练习页面
    generatePracticeQuestion(currentWord);
}

// 重置学习步骤
function resetLearningSteps() {
    const steps = document.querySelectorAll('.step-item');
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // 设置第一个步骤为活动状态
    document.querySelector('.step-item[data-step="learn"]').classList.add('active');
    
    // 隐藏所有内容区域
    const contentAreas = document.querySelectorAll('.step-content');
    contentAreas.forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示第一个内容区域
    document.getElementById('contentLearn').classList.add('active');
}

// 切换学习步骤
function switchStep(step) {
    currentStep = step;
    
    // 更新步骤状态
    const steps = document.querySelectorAll('.step-item');
    steps.forEach(s => {
        s.classList.remove('active', 'completed');
        if (s.dataset.step === step) {
            s.classList.add('active');
        } else if (['learn', 'read', 'practice', 'spell', 'write'].indexOf(s.dataset.step) < ['learn', 'read', 'practice', 'spell', 'write'].indexOf(step)) {
            s.classList.add('completed');
        }
    });
    
    // 更新内容区域
    const contentAreas = document.querySelectorAll('.step-content');
    contentAreas.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`content${step.charAt(0).toUpperCase() + step.slice(1)}`).classList.add('active');
    
    // 更新单词链条
    generateWordChain();
}

// 下一步
function nextStep() {
    const steps = ['learn', 'read', 'practice', 'spell', 'write'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        switchStep(nextStep);
    } else {
        // 所有步骤完成，进入下一个单词
        goToNextWord();
    }
}

// 上一个单词
function goToPrevWord() {
    if (currentWordIndex > 0) {
        openWordLinkPage(currentWordIndex - 1);
    }
}

// 下一个单词
function goToNextWord() {
    if (currentWordIndex < words.length - 1) {
        openWordLinkPage(currentWordIndex + 1);
    } else {
        // 最后一个单词，返回单词列表页
        backToWordList();
    }
}

// 返回单词列表页
function backToWordList() {
    window.location.href = 'word-list.html';
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevWordBtn');
    const nextBtn = document.getElementById('nextWordBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentWordIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentWordIndex === words.length - 1;
    }
}

// 生成练习问题
function generatePracticeQuestion(word) {
    const questionElement = document.getElementById('practiceQuestion');
    const optionsElement = document.getElementById('practiceOptions');
    
    if (!questionElement || !optionsElement) return;
    
    // 生成问题类型
    const questionTypes = ['meaning', 'word'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    if (questionType === 'meaning') {
        // 给出单词，选择释义
        questionElement.textContent = `"${word.word}" 的意思是？`;
        
        // 生成选项
        const options = [word.meaning];
        
        // 添加干扰选项
        while (options.length < 4) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            if (!options.includes(randomWord.meaning)) {
                options.push(randomWord.meaning);
            }
        }
        
        // 打乱选项顺序
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        // 渲染选项
        optionsElement.innerHTML = options.map(option => {
            return `
            <div class="practice-option" onclick="checkPracticeAnswer('${option}', '${word.meaning}')">
                ${option}
            </div>
            `;
        }).join('');
    } else {
        // 给出释义，选择单词
        questionElement.textContent = `哪个单词的意思是 "${word.meaning}"？`;
        
        // 生成选项
        const options = [word.word];
        
        // 添加干扰选项
        while (options.length < 4) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            if (!options.includes(randomWord.word)) {
                options.push(randomWord.word);
            }
        }
        
        // 打乱选项顺序
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        // 渲染选项
        optionsElement.innerHTML = options.map(option => {
            return `
            <div class="practice-option" onclick="checkPracticeAnswer('${option}', '${word.word}')">
                ${option}
            </div>
            `;
        }).join('');
    }
}

// 检查练习答案
function checkPracticeAnswer(selected, correct) {
    const options = document.querySelectorAll('.practice-option');
    options.forEach(option => {
        if (option.textContent.trim() === correct) {
            option.classList.add('correct');
        } else if (option.textContent.trim() === selected) {
            option.classList.add('incorrect');
        }
        option.onclick = null;
    });
    
    // 播放音效
    if (selected === correct) {
        AudioManager.playSuccessSound();
    } else {
        AudioManager.playErrorSound();
        // 添加到错词本
        const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
        DataManager.addErrorWord(currentUser, currentWord);
    }
    
    // 延迟进入下一步
    setTimeout(() => {
        nextStep();
    }, 1000);
}

// 添加字母到拼写输入框
function addLetter(letter) {
    const inputBoxes = document.querySelectorAll('.spell-input-box');
    for (let i = 0; i < inputBoxes.length; i++) {
        if (!inputBoxes[i].textContent) {
            inputBoxes[i].textContent = letter;
            break;
        }
    }
}

// 从拼写输入框移除字母
function removeLetter(index) {
    const inputBoxes = document.querySelectorAll('.spell-input-box');
    if (inputBoxes[index]) {
        inputBoxes[index].textContent = '';
    }
}

// 检查拼写
function checkSpelling() {
    const inputBoxes = document.querySelectorAll('.spell-input-box');
    let userInput = '';
    
    inputBoxes.forEach(box => {
        userInput += box.textContent;
    });
    
    const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
    const resultElement = document.getElementById('spellResult');
    
    if (userInput === currentWord.word) {
        resultElement.textContent = '正确！';
        resultElement.classList.add('correct');
        resultElement.classList.remove('incorrect');
        AudioManager.playSuccessSound();
    } else {
        resultElement.textContent = '错误，请重试！';
        resultElement.classList.add('incorrect');
        resultElement.classList.remove('correct');
        AudioManager.playErrorSound();
        // 添加到错词本
        DataManager.addErrorWord(currentUser, currentWord);
    }
}

// 检查书写
function checkWriting() {
    const input = document.getElementById('writeInput');
    const resultElement = document.getElementById('writeResult');
    const currentWord = isErrorBookMode ? errorWords[currentWordIndex] : words[currentWordIndex];
    
    if (input.value.trim() === currentWord.word) {
        resultElement.textContent = '正确！';
        resultElement.classList.add('correct');
        resultElement.classList.remove('incorrect');
        AudioManager.playSuccessSound();
    } else {
        resultElement.textContent = '错误，请重试！';
        resultElement.classList.add('incorrect');
        resultElement.classList.remove('correct');
        AudioManager.playErrorSound();
        // 添加到错词本
        DataManager.addErrorWord(currentUser, currentWord);
    }
}

// 清除书写输入
function clearWriteInput() {
    const input = document.getElementById('writeInput');
    if (input) {
        input.value = '';
    }
    
    const resultElement = document.getElementById('writeResult');
    if (resultElement) {
        resultElement.textContent = '';
        resultElement.classList.remove('correct', 'incorrect');
    }
}

// 重置录音状态
function resetRecordingState() {
    const recordBtn = document.getElementById('recordBtn');
    const playbackBtn = document.getElementById('playbackBtn');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const recordingStatus = document.getElementById('recordingStatus');
    
    if (recordBtn) {
        recordBtn.textContent = '🎤 开始录音';
        recordBtn.classList.remove('recording');
    }
    
    if (playbackBtn) {
        playbackBtn.disabled = true;
    }
    
    if (scoreDisplay) {
        document.getElementById('scoreValue').textContent = '-';
    }
    
    if (recordingStatus) {
        recordingStatus.textContent = '';
    }
}

// 切换录音状态
function toggleRecording() {
    const recordBtn = document.getElementById('recordBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    
    if (recordBtn.classList.contains('recording')) {
        // 停止录音
        recordBtn.textContent = '🎤 开始录音';
        recordBtn.classList.remove('recording');
        recordingStatus.textContent = '录音已停止';
        
        // 模拟评分
        setTimeout(() => {
            const score = Math.floor(Math.random() * 21) + 80; // 80-100分
            document.getElementById('scoreValue').textContent = score;
            document.getElementById('playbackBtn').disabled = false;
        }, 500);
    } else {
        // 开始录音
        recordBtn.textContent = '⏹️ 停止录音';
        recordBtn.classList.add('recording');
        recordingStatus.textContent = '正在录音...';
    }
}

// 回放录音
function playbackRecording() {
    const recordingStatus = document.getElementById('recordingStatus');
    recordingStatus.textContent = '正在回放...';
    
    setTimeout(() => {
        recordingStatus.textContent = '回放完成';
    }, 2000);
}

// 获取音标颜色
function getPhoneticColor(char, index, word) {
    // 元音字母
    const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
    
    // 检查是否是元音
    if (vowels.includes(char)) {
        return 'r'; // 元音用红色
    } else {
        return 'b'; // 辅音用蓝色
    }
}

// 错词本相关功能
function openErrorBookPage() {
    window.location.href = 'error-book.html';
}

function renderErrorWordList() {
    const listContainer = document.getElementById('errorWordList');
    if (!listContainer) return;
    
    const errorWords = DataManager.getErrorWords(currentUser);
    
    // 更新错词本标题，显示数量
    const errorBookTitle = document.querySelector('#errorBookPage .list-title');
    if (errorBookTitle) {
        errorBookTitle.textContent = `错词本 (${errorWords.length})`;
    }
    
    if (errorWords.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">错词本为空</div>';
        return;
    }
    
    listContainer.innerHTML = errorWords.map((word, index) => {
        return `
        <div class="word-item" data-index="${index}" onclick="openErrorWordLinkPage(${index})"><div class="word-info">
                <div class="word-text ${errorBookMaskMode === 'word' ? 'masked' : ''}" ${errorBookMaskMode === 'word' ? 'onclick="this.classList.remove(\'masked\'); event.stopPropagation();"' : ''}>${word.word}</div>
                <div class="word-phonetic">${word.phonetic || ''}</div>
            </div>
            <div class="word-meaning ${errorBookMaskMode === 'meaning' ? 'masked' : ''}" ${errorBookMaskMode === 'meaning' ? 'onclick="this.classList.remove(\'masked\'); event.stopPropagation();"' : ''}>${word.meaning}</div>
            <div class="word-actions">
                <button class="action-btn" onclick="AudioManager.playWordAudio('${word.word}', true); event.stopPropagation();">🔊</button>
            </div>
        </div>
        `;
    }).join('');
}

function startErrorWordLearning() {
    errorWords = DataManager.getErrorWords(currentUser);
    if (errorWords.length === 0) {
        alert('错词本为空');
        return;
    }
    currentWordIndex = 0;
    currentStep = 'learn';
    openErrorWordLinkPage(0);
}

function openErrorWordLinkPage(index) {
    window.location.href = `word-link.html?index=${index}&errorBook=true`;
}

function generateErrorWordChain() {
    const chainContainer = document.getElementById('wordChain');
    chainContainer.innerHTML = '';
    
    errorWords.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'chain-word-item';
        
        const wordText = document.createElement('div');
        wordText.className = 'chain-word';
        wordText.id = `chain-word-${index}`;
        
        if (index === currentWordIndex) {
            wordText.classList.add('current');
        } else if (index < currentWordIndex) {
            wordText.classList.add('completed');
        } else {
            wordText.classList.add('pending');
        }
        
        // 在拼和写步骤中遮挡当前学习的单词
        if ((currentStep === 'spell' || currentStep === 'write') && index === currentWordIndex) {
            wordText.textContent = '**';
        } else {
            wordText.textContent = word.word;
        }
        wordText.onclick = () => openErrorWordLinkPage(index);
        
        const wordIndex = document.createElement('div');
        wordIndex.className = 'chain-word-index';
        wordIndex.textContent = index + 1;
        
        wordElement.appendChild(wordText);
        wordElement.appendChild(wordIndex);
        chainContainer.appendChild(wordElement);
    });
    
    // 滚动到当前单词位置
    setTimeout(() => {
        const currentElement = document.getElementById(`chain-word-${currentWordIndex}`);
        if (currentElement) {
            currentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, 100);
}

function updateErrorWordLearningContent() {
    const currentWord = errorWords[currentWordIndex];
    if (!currentWord) return;
    
    // 更新学页面
    const wordLetters = document.getElementById('wordLetters');
    if (wordLetters) {
        wordLetters.innerHTML = '';
        for (let i = 0; i < currentWord.word.length; i++) {
            const char = currentWord.word[i];
            if (char === ' ') {
                const space = document.createElement('span');
                space.className = 'letter-space';
                space.textContent = ' ';
                space.style.width = '12px';
                wordLetters.appendChild(space);
            } else {
                const letter = document.createElement('span');
                letter.className = 'letter';
                letter.textContent = char;
                const colorCode = getPhoneticColor(char, i, currentWord.word);
                switch (colorCode) {
                    case 'r':
                        letter.style.color = '#e74c3c';
                        break;
                    case 'b':
                        letter.style.color = '#3498db';
                        break;
                    case 'g':
                        letter.style.color = '#2ecc71';
                        break;
                    default:
                        letter.style.color = '#333333';
                }
                wordLetters.appendChild(letter);
            }
        }
    }
    
    const phoneticWrapper = document.getElementById('phoneticWrapper');
    if (phoneticWrapper) {
        phoneticWrapper.textContent = currentWord.phonetic || '';
    }
    
    const learnMeaning = document.getElementById('learnMeaning');
    if (learnMeaning) {
        learnMeaning.textContent = currentWord.meaning;
    }
    
    // 更新读页面
    const readWord = document.getElementById('readWord');
    if (readWord) {
        readWord.textContent = currentWord.word;
    }
    
    const readPhonetic = document.getElementById('readPhonetic');
    if (readPhonetic) {
        readPhonetic.textContent = currentWord.phonetic || '';
    }
    
    // 更新拼页面
    const spellWord = document.getElementById('spellWord');
    if (spellWord) {
        spellWord.textContent = currentWord.word;
    }
    
    const spellInputs = document.getElementById('spellInputs');
    if (spellInputs) {
        spellInputs.innerHTML = '';
        for (let i = 0; i < currentWord.word.length; i++) {
            const inputBox = document.createElement('div');
            inputBox.className = 'spell-input-box';
            inputBox.dataset.index = i;
            inputBox.onclick = () => removeLetter(i);
            spellInputs.appendChild(inputBox);
        }
    }
    
    const spellPhonetic = document.getElementById('spellPhonetic');
    if (spellPhonetic) {
        spellPhonetic.textContent = currentWord.phonetic || '';
    }
    
    const spellLetters = document.getElementById('spellLetters');
    if (spellLetters) {
        spellLetters.innerHTML = '';
        const letters = currentWord.word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        letters.forEach((letter, index) => {
            const letterButton = document.createElement('div');
            letterButton.className = 'spell-letter';
            letterButton.textContent = letter;
            letterButton.onclick = () => addLetter(letter);
            spellLetters.appendChild(letterButton);
        });
    }
    
    // 更新写页面
    const writeWord = document.getElementById('writeWord');
    if (writeWord) {
        writeWord.textContent = currentWord.word;
    }
    
    const writePhonetic = document.getElementById('writePhonetic');
    if (writePhonetic) {
        writePhonetic.textContent = currentWord.phonetic || '';
    }
    
    const writeMeaning = document.getElementById('writeMeaning');
    if (writeMeaning) {
        writeMeaning.textContent = currentWord.meaning;
    }
    
    const writeInput = document.getElementById('writeInput');
    if (writeInput) {
        writeInput.value = '';
    }
    
    const writeResult = document.getElementById('writeResult');
    if (writeResult) {
        writeResult.textContent = '';
        writeResult.classList.remove('correct', 'incorrect');
    }
    
    // 更新练习页面
    generatePracticeQuestion(currentWord);
}

function updateErrorWordNavigationButtons() {
    const prevBtn = document.getElementById('prevWordBtn');
    const nextBtn = document.getElementById('nextWordBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentWordIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentWordIndex === errorWords.length - 1;
    }
}

// 消消乐相关功能
let gameWords = [];
let allErrorWords = [];
let currentGroupIndex = 0;
let selectedWord = null;
let selectedMeaning = null;
let gameCorrectCount = 0; // 当前分组的正确数量
let totalCorrectCount = 0; // 全局的正确数量
let gameStartTime = 0;
let gameTimerInterval = null;

function openGamePage() {
    const errorWords = DataManager.getErrorWords(currentUser);
    if (errorWords.length === 0) {
        alert('错词本为空，无法玩消消乐');
        return;
    }
    
    window.location.href = 'game.html';
}

function initGame() {
    allErrorWords = DataManager.getErrorWords(currentUser);
    currentGroupIndex = 0;
    selectedWord = null;
    selectedMeaning = null;
    totalCorrectCount = 0;
    
    // 设置总数为所有错误单词的数量
    document.getElementById('gameTotalCount').textContent = allErrorWords.length;
    
    // 加载第一组单词
    loadNextGameGroup();
    
    // 开始计时
    gameStartTime = Date.now();
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
    }
    gameTimerInterval = setInterval(updateGameTimer, 1000);
}

function loadNextGameGroup() {
    // 计算当前组的起始和结束索引
    const startIndex = currentGroupIndex * 5;
    const endIndex = startIndex + 5;
    
    // 获取当前组的单词
    gameWords = allErrorWords.slice(startIndex, endIndex);
    
    // 打乱顺序
    gameWords = gameWords.sort(() => 0.5 - Math.random());
    
    gameCorrectCount = 0;
    selectedWord = null;
    selectedMeaning = null;
    
    // 重置游戏界面
    document.getElementById('gameCorrectCount').textContent = totalCorrectCount;
    document.getElementById('gameProgressFill').style.width = (totalCorrectCount / allErrorWords.length) * 100 + '%';
    
    // 生成游戏内容
    generateGameContent();
}

function generateGameContent() {
    const wordColumn = document.getElementById('wordColumn');
    const meaningColumn = document.getElementById('meaningColumn');
    
    wordColumn.innerHTML = '';
    meaningColumn.innerHTML = '';
    
    // 打乱单词顺序
    const shuffledWords = [...gameWords].sort(() => 0.5 - Math.random());
    const shuffledMeanings = [...gameWords].sort(() => 0.5 - Math.random());
    
    shuffledWords.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'game-item';
        wordItem.textContent = word.word;
        wordItem.dataset.word = word.word;
        wordItem.onclick = () => selectGameItem('word', wordItem, word.word);
        wordColumn.appendChild(wordItem);
    });
    
    shuffledMeanings.forEach((word, index) => {
        const meaningItem = document.createElement('div');
        meaningItem.className = 'game-item';
        meaningItem.textContent = word.meaning;
        meaningItem.dataset.meaning = word.meaning;
        meaningItem.dataset.word = word.word;
        meaningItem.onclick = () => selectGameItem('meaning', meaningItem, word.word);
        meaningColumn.appendChild(meaningItem);
    });
}

function selectGameItem(type, element, word) {
    if (type === 'word') {
        // 取消之前的选择
        document.querySelectorAll('#wordColumn .game-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');
        selectedWord = word;
    } else {
        document.querySelectorAll('#meaningColumn .game-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');
        selectedMeaning = word;
    }
    
    // 检查匹配
    if (selectedWord && selectedMeaning) {
        if (selectedWord === selectedMeaning) {
            // 匹配成功
            gameCorrectCount++;
            totalCorrectCount++;
            document.getElementById('gameCorrectCount').textContent = totalCorrectCount;
            
            // 更新进度条
            const progress = (totalCorrectCount / allErrorWords.length) * 100;
            document.getElementById('gameProgressFill').style.width = progress + '%';
            
            // 标记正确
            document.querySelectorAll(`#wordColumn .game-item[data-word="${selectedWord}"]`).forEach(item => {
                item.classList.add('correct');
                item.classList.remove('selected');
            });
            document.querySelectorAll(`#meaningColumn .game-item[data-word="${selectedMeaning}"]`).forEach(item => {
                item.classList.add('correct');
                item.classList.remove('selected');
            });
            
            // 播放成功音效
            AudioManager.playSuccessSound();
            
            // 重置选择
            selectedWord = null;
            selectedMeaning = null;
            
            // 检查游戏是否完成
            if (gameCorrectCount === gameWords.length) {
                // 检查是否还有下一组单词
                const nextGroupStart = (currentGroupIndex + 1) * 5;
                if (nextGroupStart < allErrorWords.length) {
                    // 有下一组，加载下一组
                    currentGroupIndex++;
                    setTimeout(() => {
                        loadNextGameGroup();
                    }, 1000);
                } else {
                    // 所有组都完成了，游戏结束
                    clearInterval(gameTimerInterval);
                    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
                    const minutes = Math.floor(timeSpent / 60);
                    const seconds = timeSpent % 60;
                    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                    // 延迟弹窗，给浏览器时间渲染最终结果
                    setTimeout(() => {
                        alert(`恭喜完成所有错词的消消乐！用时：${timeString}`);
                    }, 500);
                }
            }
        } else {
            // 匹配失败
            AudioManager.playErrorSound();
            selectedWord = null;
            selectedMeaning = null;
            document.querySelectorAll('.game-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
    }
}

function updateGameTimer() {
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    document.getElementById('gameTimer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 学习统计相关功能
function openStatsPage() {
    window.location.href = 'stats.html';
}

function updateStatsPage() {
    const userData = DataManager.getUserData(currentUser);
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('statsDate').textContent = today;
    document.getElementById('todayCompleted').textContent = userData?.today?.learning || 0;
    document.getElementById('todayError').textContent = userData?.today?.error || 0;
    document.getElementById('totalCompleted').textContent = userData?.total?.learning || 0;
    document.getElementById('totalError').textContent = userData?.total?.error || 0;
}

// 页面卸载时保存
window.addEventListener('beforeunload', () => {
    const userKey = `userStats_${currentUser}`;
    // 先获取当前数据，确保包含 errorWords
    const currentData = DataManager.getUserData(currentUser);
    if (currentData) {
        // 合并 userStats 和 currentData，确保 errorWords 被保留
        const saveData = {
            ...currentData,
            ...userStats,
            errorWords: currentData.errorWords // 确保 errorWords 从当前数据中获取
        };
        localStorage.setItem(userKey, JSON.stringify(saveData));
        // console.log(`[错词本日志] 页面卸载时保存数据:`, saveData);
    } else {
        localStorage.setItem(userKey, JSON.stringify(userStats));
        // console.log(`[错词本日志] 页面卸载时保存新数据:`, userStats);
    }
});