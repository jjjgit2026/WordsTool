const fs = require('fs');
const pdf = require('pdf-parse');

async function preprocessPDF() {
    // 获取所有PDF文件
    const pdfFiles = fs.readdirSync('./PDF').filter(file => file.endsWith('.pdf'));
    
    for (const pdfFile of pdfFiles) {
        console.log(`开始预处理${pdfFile}文件...`);
        
        try {
            // 读取PDF文件
            const dataBuffer = fs.readFileSync(`./PDF/${pdfFile}`);
            
            // 解析PDF
            const data = await pdf(dataBuffer);
            
            // 提取文本
            const text = data.text;
            
            // 解析文本，提取单词数据
            const words = parseWords(text);
            
            // 生成JSON文件
            const jsonFile = pdfFile.replace('.pdf', '.json');
            const jsonContent = JSON.stringify(words, null, 2);
            fs.writeFileSync(jsonFile, jsonContent);
            
            console.log(`预处理完成！成功提取了 ${words.length} 个单词`);
            console.log(`生成的JSON文件: ${jsonFile}`);
            
        } catch (error) {
            console.error(`预处理${pdfFile}失败:`, error);
        }
    }
}

function parseWords(text) {
    const words = [];
    
    // 按行分割文本
    const lines = text.split('\n');
    
    // 存储当前正在处理的单词信息
    let currentWord = null;
    
    // 遍历每一行
    for (let line of lines) {
        line = line.trim();
        
        // 跳过空行
        if (!line) continue;
        
        // 检查是否是序号行（以数字开头）
        const numberMatch = line.match(/^(\d+)(\s|$)/);
        if (numberMatch) {
            // 如果有正在处理的单词，先保存
            if (currentWord) {
                words.push(currentWord);
            }
            
            // 开始处理新单词
            const number = numberMatch[1];
            // 提取序号后的内容
            const remainingText = line.substring(numberMatch[0].length).trim();
            
            currentWord = {
                number: number,
                word: '',
                phonetic: '',
                meaning: ''
            };
            
            // 检查剩余内容是否是单词
            if (remainingText && !remainingText.includes('/') && !remainingText.includes('[')) {
                currentWord.word = remainingText;
            }
        } else if (currentWord) {
            // 检查是否是音标行（通常以/或[开头，以/或]结尾，不包含汉字）
            const isPhonetic = (line.startsWith('/') && line.endsWith('/')) || 
                              (line.startsWith('[') && line.endsWith(']')) ||
                              (line.includes('/') && !line.match(/[\u4e00-\u9fa5]/));
            
            if (isPhonetic) {
                currentWord.phonetic = line;
            } else {
                // 检查是否是单词行（如果之前没有提取到单词）
                if (!currentWord.word) {
                    currentWord.word = line;
                } else {
                    // 否则是释义行
                    if (currentWord.meaning) {
                        currentWord.meaning = (currentWord.meaning + ' ' + line.replace(/□/g, '').trim()).trim();
                    } else {
                        currentWord.meaning = line.replace(/□/g, '').trim();
                    }
                }
            }
        }
    }
    
    // 保存最后一个单词
    if (currentWord) {
        words.push(currentWord);
    }
    
    return words;
}

// 运行预处理
preprocessPDF();