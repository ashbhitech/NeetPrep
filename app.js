// NEET Prep Quiz PWA - Main Application Logic
// Updated: v2.0 - Pure Google Identity Services (no gapi)

class NeetQuizApp {
    constructor() {
        this.isAuthenticated = false;
        this.sheetData = null;
        this.quizData = [];
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.deferredPrompt = null;
        
        // Expected Google Sheet structure - Updated to match your column names
        this.expectedColumns = {
            question: ['question', 'q', 'questions'],
            optionA: ['option 1', 'option a', 'a', 'optiona', 'opt a', 'optiona', 'OptionA'],
            optionB: ['option 2', 'option b', 'b', 'optionb', 'opt b', 'optionb', 'OptionB'],
            optionC: ['option 3', 'option c', 'c', 'optionc', 'opt c', 'optionc', 'OptionC'],
            optionD: ['option 4', 'option d', 'd', 'optiond', 'opt d', 'optiond', 'OptionD'],
            correctAnswer: ['answer', 'correct', 'correct answer', 'correctAnswer', 'correctanswer'],
            subject: ['subject', 'subjects'],
            topic: ['topic/chapter', 'topic', 'topics', 'chapter', 'chapters', 'Topic'],
            difficulty: ['difficulty level', 'difficulty', 'level', 'difficult']
        };
        
        this.init();
    }
    
    async init() {
        console.log('Initializing NEET Quiz PWA...');
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Initialize Google API
        await this.initGoogleAPI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check authentication status
        await this.checkAuthStatus();
        
        // Setup PWA installation
        this.setupPWAInstallation();
        
        console.log('NEET Quiz PWA initialized successfully');
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    async initGoogleAPI() {
        return new Promise((resolve, reject) => {
            console.log('Initializing Google Identity Services...');
            
            // Wait for Google Identity Services to load
            const checkGoogleLoaded = () => {
                if (typeof google !== 'undefined' && google.accounts) {
                    console.log('✅ Google Identity Services loaded');
                    this.googleLoaded = true;
                    resolve();
                } else {
                    console.log('Waiting for Google Identity Services...');
                    setTimeout(checkGoogleLoaded, 100);
                }
            };
            
            // Start checking for Google Identity Services
            checkGoogleLoaded();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.googleLoaded) {
                    const error = 'Google Identity Services not loaded';
                    console.error(error);
                    reject(new Error(error));
                }
            }, 10000);
        });
    }
    
    setupEventListeners() {
        // Authentication
        document.getElementById('authBtn').addEventListener('click', () => {
            this.handleAuthentication();
        });
        
        // Quiz selection
        document.getElementById('subjectSelect').addEventListener('change', () => {
            this.updateTopicOptions();
            this.updateStartButton();
        });
        
        document.getElementById('topicSelect').addEventListener('change', () => {
            this.updateStartButton();
        });
        
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            this.startQuiz();
        });
        
        // Quiz navigation
        document.getElementById('nextQuestionBtn').addEventListener('click', () => {
            this.nextQuestion();
        });
        
        // Results
        document.getElementById('viewSummaryBtn').addEventListener('click', () => {
            this.showSummary();
        });
        
        document.getElementById('retakeQuizBtn').addEventListener('click', () => {
            this.retakeQuiz();
        });
        
        document.getElementById('backToResultsBtn').addEventListener('click', () => {
            this.showResultsFromSummary();
        });
        
        // Install button
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installPWA();
        });
        
        // Load sheet button (for debugging)
        document.getElementById('loadSheetBtn').addEventListener('click', () => {
            this.loadSheetData();
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.handleOfflineStatus();
        });
    }
    
    async checkAuthStatus() {
        // Check if user is already signed in
        console.log('Checking authentication status...');
        
        // For now, show auth section to test Google Sign-In
        this.showAuthSection();
    }
    
    async handleCredentialResponse(response) {
        console.log('🔐 Credential response received:', response);
        
        try {
            this.showLoading('Signing in...');
            
            if (!response || !response.credential) {
                throw new Error('No credential in response');
            }
            
            // Decode the JWT token to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            console.log('👤 User payload:', payload);
            
            // Exchange the credential for an access token
            console.log('🔄 Starting token exchange...');
            await this.exchangeCredentialForToken(response.credential);
            
            this.isAuthenticated = true;
            console.log('✅ Authentication successful!');
            
            this.hideLoading();
            this.showQuizSelection();
            await this.loadSheetData();
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            this.hideLoading();
            this.showError(`Authentication failed: ${error.message}. Please try again.`);
        }
    }
    
    async exchangeCredentialForToken(credential) {
        try {
            console.log('Starting token exchange...');
            
            // Check if google.accounts.oauth2 is available
            if (!google || !google.accounts || !google.accounts.oauth2) {
                throw new Error('Google OAuth2 library not loaded');
            }
            
            // Use the credential to get an access token
            return new Promise((resolve, reject) => {
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: '375600345001-lp91g4mtpltgnpaup23bh360nht0jrl4.apps.googleusercontent.com',
                    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
                    callback: async (tokenResponse) => {
                        try {
                            console.log('Token received:', tokenResponse);
                            this.accessToken = tokenResponse.access_token;
                            
                            // For now, just store the token and proceed
                            // We'll handle Google Sheets API calls directly with fetch
                            console.log('✅ Access token obtained successfully');
                            resolve();
                            
                        } catch (error) {
                            console.error('❌ Error processing token:', error);
                            reject(new Error(`Token processing failed: ${error.message}`));
                        }
                    }
                });
                
                console.log('Requesting access token...');
                tokenClient.requestAccessToken();
            });
            
        } catch (error) {
            console.error('❌ Token exchange failed:', error);
            throw new Error(`Token exchange failed: ${error.message}`);
        }
    }
    
    
    async handleAuthentication() {
        // This method is now handled by the Google Sign-In button
        console.log('Authentication handled by Google Sign-In button');
    }
    
    async loadSheetData() {
        if (!this.isAuthenticated) return;
        
        try {
            this.showLoading('Loading quiz questions...');
            
            const sheetId = '1bSImKOku57K7bJJa0_qdBKdmQg3p-J9ZcV71JPIPIto'; 
            
            // Try to load from Google Sheets if we have an access token
            if (this.accessToken) {
                console.log('Loading from Google Sheets using direct API calls...');
                console.log('Access token available:', !!this.accessToken);
                
                const response = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('Google Sheets API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Raw Google Sheets data:', data);
                    
                    const values = data.values;
                    console.log('Values array:', values);
                    
                    if (values && values.length > 0) {
                        console.log(`✅ Loaded ${values.length} rows from Google Sheets`);
                        console.log('Headers (first row):', values[0]);
                        
                        this.processQuizData(values);
                        this.populateSubjectOptions();
                        this.hideLoading();
                        return;
                    } else {
                        console.log('No values found in response');
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Google Sheets API error:', response.status, response.statusText);
                    console.error('Error details:', errorText);
                }
            } else {
                console.log('No access token available');
            }
            
            // Fallback to mock data
            console.log('Using mock data. Google Sheets integration in progress...');
            this.loadMockData();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading sheet data:', error);
            this.hideLoading();
            this.showError('Failed to load quiz data. Using sample questions.');
            this.loadMockData();
        }
    }
    
    processQuizData(values) {
        const headers = values[0];
        const dataRows = values.slice(1);
        
        // Map columns to our expected structure
        const columnMap = this.mapColumns(headers);

        console.log('Headers:', headers);
        console.log('Column map:', columnMap);
        console.log('Total data rows to process:', dataRows.length);
        this.quizData = dataRows.map((row, index) => {
            const questionData = {
                id: index + 1,
                question: row[columnMap.question] || '',
                optionA: row[columnMap.optionA] || '',
                optionB: row[columnMap.optionB] || '',
                optionC: row[columnMap.optionC] || '',
                optionD: row[columnMap.optionD] || '',
                correctAnswer: row[columnMap.correctAnswer] || '',
                subject: row[columnMap.subject] || 'General',
                topic: row[columnMap.topic] || '',
                difficulty: row[columnMap.difficulty] || 'Medium'
            };
            
            // Debug first few questions
            if (index < 3) {
                console.log(`Question ${index + 1} data:`, questionData);
                console.log(`  Raw correctAnswer from sheet: "${row[columnMap.correctAnswer]}"`);
            }
            
            return questionData;
        });
        
        console.log(`Questions before filtering: ${this.quizData.length}`);
        
        // Filter out questions with missing data
        this.quizData = this.quizData.filter(item => {
            const hasRequiredData = item.question && item.optionA && item.optionB && item.optionC && item.optionD;
            if (!hasRequiredData) {
                console.log(`Filtered out question ${item.id}:`, item);
            }
            return hasRequiredData;
        });
        
        console.log(`Loaded ${this.quizData.length} quiz questions after filtering`);
    }
    
    mapColumns(headers) {
        const map = {};
        
        Object.keys(this.expectedColumns).forEach(key => {
            const possibleNames = this.expectedColumns[key];
            const index = headers.findIndex(header => 
                header && possibleNames.some(name => 
                    header.toLowerCase().trim() === name.toLowerCase()
                )
            );
            map[key] = index;
        });
        
        return map;
    }
    
    loadMockData() {
        // Mock data for testing when Google Sheets is not available
        this.quizData = [
            {
                id: 1,
                question: "What is the SI unit of force?",
                optionA: "Newton",
                optionB: "Joule",
                optionC: "Watt",
                optionD: "Pascal",
                correctAnswer: "A",
                subject: "Physics",
                difficulty: "Easy"
            },
            {
                id: 2,
                question: "Which of the following is the chemical symbol for Gold?",
                optionA: "Go",
                optionB: "Au",
                optionC: "Ag",
                optionD: "Gd",
                correctAnswer: "B",
                subject: "Chemistry",
                difficulty: "Medium"
            },
            {
                id: 3,
                question: "What is the powerhouse of the cell?",
                optionA: "Nucleus",
                optionB: "Mitochondria",
                optionC: "Ribosome",
                optionD: "Endoplasmic reticulum",
                correctAnswer: "B",
                subject: "Biology",
                difficulty: "Easy"
            },
            {
                id: 4,
                question: "Which law states that energy cannot be created or destroyed?",
                optionA: "Newton's First Law",
                optionB: "Law of Conservation of Energy",
                optionC: "Ohm's Law",
                optionD: "Boyle's Law",
                correctAnswer: "B",
                subject: "Physics",
                difficulty: "Medium"
            },
            {
                id: 5,
                question: "What is the pH of pure water?",
                optionA: "6",
                optionB: "7",
                optionC: "8",
                optionD: "14",
                correctAnswer: "B",
                subject: "Chemistry",
                difficulty: "Easy"
            }
        ];
        
        // Add more mock questions to reach 20
        for (let i = 6; i <= 20; i++) {
            const subjects = ['Physics', 'Chemistry', 'Biology'];
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            
            this.quizData.push({
                id: i,
                question: `Sample question ${i} for ${subject}?`,
                optionA: `Option A for question ${i}`,
                optionB: `Option B for question ${i}`,
                optionC: `Option C for question ${i}`,
                optionD: `Option D for question ${i}`,
                correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
                subject: subject,
                difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)]
            });
        }
        
        this.populateSubjectOptions();
    }
    
    populateSubjectOptions() {
        const subjectSelect = document.getElementById('subjectSelect');
        const subjects = [...new Set(this.quizData.map(q => q.subject))].sort();
        
        // Clear existing options except the first one
        subjectSelect.innerHTML = '<option value="">Choose Subject</option>';
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
    
    updateTopicOptions() {
        const subjectSelect = document.getElementById('subjectSelect');
        const topicSelect = document.getElementById('topicSelect');
        const selectedSubject = subjectSelect.value;
        
        // Clear existing options except the first one
        topicSelect.innerHTML = '<option value="">All Topics</option>';
        
        if (selectedSubject) {
            const topics = [...new Set(
                this.quizData
                    .filter(q => q.subject === selectedSubject)
                    .map(q => q.topic)
            )].sort();
            
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic;
                option.textContent = topic;
                topicSelect.appendChild(option);
            });
        }
    }
    
    updateStartButton() {
        const subjectSelect = document.getElementById('subjectSelect');
        const startBtn = document.getElementById('startQuizBtn');
        
        startBtn.disabled = !subjectSelect.value;
    }
    
    startQuiz() {
        const subjectSelect = document.getElementById('subjectSelect');
        const topicSelect = document.getElementById('topicSelect');
        
        const selectedSubject = subjectSelect.value;
        const selectedTopic = topicSelect.value;
        
        if (!selectedSubject) {
            this.showError('Please select a subject');
            return;
        }
        
        // Filter questions based on selection
        let filteredQuestions = this.quizData.filter(q => q.subject === selectedSubject);
        
        if (selectedTopic) {
            filteredQuestions = filteredQuestions.filter(q => q.topic === selectedTopic);
        }
        
        // Shuffle and take 20 questions
        this.currentQuiz = this.shuffleArray([...filteredQuestions]).slice(0, 20);
        
        if (this.currentQuiz.length === 0) {
            this.showError('No questions found for the selected subject and topic');
            return;
        }
        
        // Initialize quiz state
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        // Show quiz interface
        this.showQuizInterface();
        this.displayQuestion();
        
        console.log(`Started quiz with ${this.currentQuiz.length} questions`);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    showQuizInterface() {
        document.getElementById('quizSelection').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        // Update quiz header
        const subjectSelect = document.getElementById('subjectSelect');
        document.getElementById('quizSubject').textContent = subjectSelect.value;
        document.getElementById('totalQuestions').textContent = this.currentQuiz.length;
    }
    
    displayQuestion() {
        const question = this.currentQuiz[this.currentQuestionIndex];
        const questionNumber = this.currentQuestionIndex + 1;
        
        // Update progress
        document.getElementById('questionNumber').textContent = questionNumber;
        const progress = (questionNumber / this.currentQuiz.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        // Display question
        document.getElementById('questionText').textContent = question.question;
        
        // Display options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        const options = [
            { key: 'A', value: question.optionA },
            { key: 'B', value: question.optionB },
            { key: 'C', value: question.optionC },
            { key: 'D', value: question.optionD }
        ];
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.innerHTML = `<strong>${option.key}.</strong> ${option.value}`;
            button.dataset.option = option.key;
            
            button.addEventListener('click', () => {
                this.selectOption(option.key, button);
            });
            
            optionsContainer.appendChild(button);
        });
        
        // Update next button
        const nextBtn = document.getElementById('nextQuestionBtn');
        nextBtn.disabled = true;
        nextBtn.textContent = this.currentQuestionIndex === this.currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question →';
    }
    
    selectOption(selectedOption, buttonElement) {
        // Remove previous selection
        document.querySelectorAll('.option-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Mark selected option
        buttonElement.classList.add('selected');
        
        // Store user answer
        this.userAnswers[this.currentQuestionIndex] = selectedOption;
        
        console.log(`Selected option: ${selectedOption} for question ${this.currentQuestionIndex + 1}`);
        console.log('Current userAnswers:', this.userAnswers);
        
        // Enable next button
        document.getElementById('nextQuestionBtn').disabled = false;
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            this.finishQuiz();
        }
    }
    
    finishQuiz() {
        this.calculateResults();
        this.showResults();
    }
    
    calculateResults() {
        console.log('calculateResults called');
        console.log('currentQuiz length:', this.currentQuiz.length);
        console.log('userAnswers:', this.userAnswers);
        console.log('currentQuiz questions:', this.currentQuiz.map(q => ({id: q.id, question: q.question.substring(0, 50) + '...'})));
        
        let correct = 0;
        let attempted = 0;
        
        this.currentQuiz.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            console.log(`\n=== Question ${index + 1} Calculation ===`);
            console.log('Raw correctAnswer:', question.correctAnswer);
            console.log('Raw userAnswer:', userAnswer);
            console.log('Question options:', {
                optionA: question.optionA,
                optionB: question.optionB,
                optionC: question.optionC,
                optionD: question.optionD
            });
            
            if (userAnswer) {
                attempted++;
                // Map both answers to numbers for comparison
                const userAnswerNumber = this.mapAnswerToNumber(userAnswer);
                const correctAnswerNumber = this.mapAnswerToNumber(question.correctAnswer, question);
                
                console.log('Mapped userAnswerNumber:', userAnswerNumber);
                console.log('Mapped correctAnswerNumber:', correctAnswerNumber);
                console.log('Are they equal?', userAnswerNumber === correctAnswerNumber);
                
                if (userAnswerNumber === correctAnswerNumber) {
                    correct++;
                    console.log('✅ CORRECT!');
                } else {
                    console.log('❌ INCORRECT');
                }
            } else {
                console.log('No user answer provided');
            }
        });
        
        console.log(`Final counts - Total: ${this.currentQuiz.length}, Attempted: ${attempted}, Correct: ${correct}`);
        
        this.quizResults = {
            total: this.currentQuiz.length,
            attempted: attempted,
            correct: correct,
            percentage: Math.round((correct / attempted) * 100) || 0,
            questions: this.currentQuiz.map((question, index) => {
                const userAnswer = this.userAnswers[index];
                const correctAnswer = question.correctAnswer;
                
                // Map user answer (A,B,C,D) to option number (1,2,3,4)
                const userAnswerNumber = this.mapAnswerToNumber(userAnswer);
                const correctAnswerNumber = this.mapAnswerToNumber(correctAnswer, question);
                
                const isCorrect = userAnswerNumber === correctAnswerNumber;
                
                console.log(`Question ${index + 1}: correctAnswer="${correctAnswer}" (${correctAnswerNumber}), userAnswer="${userAnswer}" (${userAnswerNumber}), isCorrect=${isCorrect}`);
                
                return {
                    ...question,
                    userAnswer: userAnswer,
                    isCorrect: isCorrect,
                    isAttempted: !!userAnswer
                };
            })
        };
        
        console.log('quizResults:', this.quizResults);
    }
    
    mapAnswerToNumber(answer, question = null) {
        if (!answer) return null;
        
        const answerStr = answer.toString().trim();
        console.log(`  mapAnswerToNumber called with: "${answerStr}"`);
        
        // If we have a question object, try to match the answer text with option texts
        if (question) {
            console.log(`  Comparing with options:`);
            console.log(`    optionA: "${question.optionA}"`);
            console.log(`    optionB: "${question.optionB}"`);
            console.log(`    optionC: "${question.optionC}"`);
            console.log(`    optionD: "${question.optionD}"`);
            
            if (question.optionA && answerStr === question.optionA.trim()) {
                console.log(`  ✅ Matched optionA, returning 1`);
                return 1;
            }
            if (question.optionB && answerStr === question.optionB.trim()) {
                console.log(`  ✅ Matched optionB, returning 2`);
                return 2;
            }
            if (question.optionC && answerStr === question.optionC.trim()) {
                console.log(`  ✅ Matched optionC, returning 3`);
                return 3;
            }
            if (question.optionD && answerStr === question.optionD.trim()) {
                console.log(`  ✅ Matched optionD, returning 4`);
                return 4;
            }
            console.log(`  ❌ No text match found`);
        }
        
        // Fallback to letter/number mapping
        const upperAnswer = answerStr.toUpperCase();
        switch (upperAnswer) {
            case 'A':
            case '1':
            case 'OPTION 1':
            case 'OPTION A':
                return 1;
            case 'B':
            case '2':
            case 'OPTION 2':
            case 'OPTION B':
                return 2;
            case 'C':
            case '3':
            case 'OPTION 3':
            case 'OPTION C':
                return 3;
            case 'D':
            case '4':
            case 'OPTION 4':
            case 'OPTION D':
                return 4;
            default:
                console.warn(`Unknown answer format: "${answer}"`);
                return null;
        }
    }
    
    mapNumberToLetter(number) {
        if (!number) return null;
        
        switch (number) {
            case 1:
                return 'A';
            case 2:
                return 'B';
            case 3:
                return 'C';
            case 4:
                return 'D';
            default:
                console.warn(`Unknown number format: "${number}"`);
                return null;
        }
    }
    
    showResults() {
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';
        
        // Update results display
        document.getElementById('scorePercentage').textContent = `${this.quizResults.percentage}%`;
        document.getElementById('correctCount').textContent = this.quizResults.correct;
        document.getElementById('attemptedCount').textContent = this.quizResults.attempted;
        document.getElementById('totalCount').textContent = this.quizResults.total;
    }
    
    showSummary() {
        console.log('showSummary called');
        console.log('quizResults:', this.quizResults);
        
        if (!this.quizResults || !this.quizResults.questions) {
            console.error('No quiz results available for summary');
            alert('No quiz results available. Please complete a quiz first.');
            return;
        }
        
        const resultsContainer = document.getElementById('resultsContainer');
        const summaryContainer = document.getElementById('summaryContainer');
        
        console.log('resultsContainer:', resultsContainer);
        console.log('summaryContainer:', summaryContainer);
        
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            console.log('Hid results container');
        }
        
        if (summaryContainer) {
            summaryContainer.style.display = 'block';
            console.log('Showed summary container');
        } else {
            console.error('summaryContainer element not found');
        }
        
        this.displaySummary();
    }
    
    displaySummary() {
        console.log('displaySummary called');
        console.log('Questions count:', this.quizResults.questions.length);
        
        const summaryContent = document.getElementById('summaryContent');
        if (!summaryContent) {
            console.error('summaryContent element not found');
            return;
        }
        
        summaryContent.innerHTML = '';
        
        console.log('Creating summary items for', this.quizResults.questions.length, 'questions');
        
        this.quizResults.questions.forEach((question, index) => {
            console.log(`Creating summary item for question ${index + 1}`);
            
            const summaryItem = document.createElement('div');
            summaryItem.className = `summary-item ${question.isCorrect ? 'correct' : question.isAttempted ? 'incorrect' : 'unattempted'}`;
            
            const status = question.isCorrect ? 'Correct' : question.isAttempted ? 'Incorrect' : 'Unattempted';
            const statusClass = question.isCorrect ? 'correct' : question.isAttempted ? 'incorrect' : 'unattempted';
            
            // Get the correct answer letter (A, B, C, D) from the correct answer number
            const correctAnswerNumber = this.mapAnswerToNumber(question.correctAnswer, question);
            const correctAnswerLetter = this.mapNumberToLetter(correctAnswerNumber);
            
            // Debug logging
            console.log(`Summary Q${index + 1}:`);
            console.log('  Raw correctAnswer:', question.correctAnswer);
            console.log('  correctAnswerNumber:', correctAnswerNumber);
            console.log('  correctAnswerLetter:', correctAnswerLetter);
            console.log('  question object:', question);
            
            // Get the user answer letter
            const userAnswerLetter = question.userAnswer;
            
            summaryItem.innerHTML = `
                <div class="summary-question">
                    <strong>Q${index + 1}:</strong> ${question.question}
                </div>
                <div class="summary-options">
                    <div class="summary-option ${correctAnswerLetter === 'A' ? 'correct-answer' : ''} ${userAnswerLetter === 'A' ? 'user-answer' + (question.isCorrect ? ' correct' : ' incorrect') : ''}">
                        <strong>A.</strong> ${question.optionA}
                    </div>
                    <div class="summary-option ${correctAnswerLetter === 'B' ? 'correct-answer' : ''} ${userAnswerLetter === 'B' ? 'user-answer' + (question.isCorrect ? ' correct' : ' incorrect') : ''}">
                        <strong>B.</strong> ${question.optionB}
                    </div>
                    <div class="summary-option ${correctAnswerLetter === 'C' ? 'correct-answer' : ''} ${userAnswerLetter === 'C' ? 'user-answer' + (question.isCorrect ? ' correct' : ' incorrect') : ''}">
                        <strong>C.</strong> ${question.optionC}
                    </div>
                    <div class="summary-option ${correctAnswerLetter === 'D' ? 'correct-answer' : ''} ${userAnswerLetter === 'D' ? 'user-answer' + (question.isCorrect ? ' correct' : ' incorrect') : ''}">
                        <strong>D.</strong> ${question.optionD}
                    </div>
                </div>
                <div class="summary-status ${statusClass}">
                    <div class="answer-info">
                        <strong>Correct Answer:</strong> ${correctAnswerLetter || question.correctAnswer} - ${question[`option${correctAnswerLetter}`] || 'Not found'}
                    </div>
                    ${question.isAttempted ? 
                        `<div class="user-answer-info ${question.isCorrect ? 'correct' : 'incorrect'}">
                            <strong>Your Answer:</strong> ${userAnswerLetter} - ${question[`option${userAnswerLetter}`] || 'Not found'}
                        </div>` : 
                        '<div class="user-answer-info unattempted"><strong>Your Answer:</strong> Not attempted</div>'
                    }
                </div>
            `;
            
            console.log(`Appending summary item ${index + 1} to DOM`);
            summaryContent.appendChild(summaryItem);
        });
        
        console.log('Summary content HTML length:', summaryContent.innerHTML.length);
        console.log('Summary content children count:', summaryContent.children.length);
    }
    
    showResultsFromSummary() {
        document.getElementById('summaryContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';
    }
    
    retakeQuiz() {
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('quizSelection').style.display = 'block';
        
        // Reset form
        document.getElementById('subjectSelect').value = '';
        document.getElementById('topicSelect').value = '';
        document.getElementById('topicSelect').innerHTML = '<option value="">All Topics</option>';
        document.getElementById('startQuizBtn').disabled = true;
    }
    
    showAuthSection() {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('quizSelection').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('summaryContainer').style.display = 'none';
    }
    
    showQuizSelection() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('quizSelection').style.display = 'flex';
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('summaryContainer').style.display = 'none';
    }
    
    setupPWAInstallation() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });
        
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
        });
    }
    
    async installPWA() {
        if (!this.deferredPrompt) {
            this.showError('App installation not available');
            return;
        }
        
        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            
            this.deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
            
        } catch (error) {
            console.error('Installation failed:', error);
            this.showError('Installation failed');
        }
    }
    
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    handleOnlineStatus() {
        console.log('App is online');
    }
    
    handleOfflineStatus() {
        console.log('App is offline');
    }
}

// Global callback function for Google Sign-In
window.handleCredentialResponse = (response) => {
    if (window.app) {
        window.app.handleCredentialResponse(response);
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeetQuizApp();
});

// Add CSS for toast animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
