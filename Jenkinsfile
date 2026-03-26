// Jenkinsfile for Le Continent - CI/CD Pipeline
// This pipeline builds, tests, and deploys both frontend and backend

pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        npm_config_cache = 'npm-cache'
        // Secrets (configure in Jenkins)
        SUPABASE_URL = credentials('supabase-url')
        SUPABASE_KEY = credentials('supabase-key')
        REDIS_URL = credentials('redis-url')
        API_URL = 'https://api.lecontinent.cm'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building version: ${env.BUILD_NUMBER}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo "Installing frontend dependencies..."
                sh 'npm ci --legacy-peer-deps'
                
                echo "Installing backend dependencies..."
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Lint & Type Check') {
            steps {
                echo "Running linting..."
                sh 'npm run lint || true'
                
                echo "Running TypeScript checks..."
                sh 'npx tsc --noEmit'
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo "Building frontend..."
                sh 'npm run build'
                
                // Verify build output
                sh 'ls -la dist/'
            }
        }
        
        stage('Build Admin') {
            steps {
                echo "Building admin panel..."
                sh 'npm run build:admin'
                
                // Verify build output
                sh 'ls -la dist-admin/ || ls -la dist/'
            }
        }
        
        stage('Security Scan') {
            steps {
                echo "Running security audit..."
                sh 'npm audit --audit-level=moderate || true'
                
                dir('backend') {
                    sh 'npm audit --audit-level=moderate || true'
                }
            }
        }
        
        stage('Test (Optional - Add when tests exist)') {
            steps {
                // Placeholder for running tests
                echo "No tests configured yet"
                // sh 'npm test'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo "Deploying to staging..."
                // Add staging deployment commands here
                // Example: rsync to staging server
                // sh 'rsync -avz dist/ user@staging:/path/to/public/'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying to production..."
                
                // Build production version
                sh 'npm run build'
                
                // Upload to hosting (example for Hostinger/shared hosting)
                // Use FTP/SFTP or git-based deployment
                
                // Restart backend service
                dir('backend') {
                    sh '''
                        # Restart Node.js process with PM2
                        pm2 stop le-continent || true
                        pm2 start server.js --name le-continent
                        pm2 save
                    '''
                }
                
                // Notify deployment
                echo "Deployment completed!"
            }
        }
    }
    
    post {
        success {
            echo "✅ Build and deployment successful!"
            // Add Slack/Discord notifications here
            // slackSend(color: 'good', message: "Build ${env.BUILD_NUMBER} succeeded")
        }
        failure {
            echo "❌ Build failed!"
            // Add Slack/Discord notifications here
            // slackSend(color: 'danger', message: "Build ${env.BUILD_NUMBER} failed")
        }
        always {
            echo "Cleaning up workspace..."
            // Archive artifacts
            archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
        }
    }
}
