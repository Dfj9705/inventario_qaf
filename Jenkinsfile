pipeline {
  agent any
  options { timestamps(); skipDefaultCheckout(false) }
  environment {
    NODEJS_VERSION = 'Node16'           // (opcional) si usas el plugin NodeJS
    SONAR_INSTALL  = 'TESTSONAR'        // nombre de la instalación de sonar-scanner en Jenkins > Global Tool
    SONAR_PROJECT  = 'PQAFINALFRONT'
    SONAR_NAME     = 'TEST SONAR'        // nombre de tu server en Manage Jenkins > System > SonarQube servers
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install deps') {
      steps {
        script {
          if (isUnix()) {
            sh 'node -v || true'
            sh 'npm ci'
          } else {
            bat 'node -v'
            bat 'npm ci'
          }
        }
      }
    }

    stage('Tests + Coverage') {
      steps {
        script {
          // Asegúrate que tu package.json genera coverage en lcov o cobertura compatible
          if (isUnix()) {
            sh 'npm test -- --coverage'
          } else {
            bat 'npm test -- --coverage'
          }
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit/*.xml'  // si exportas JUnit
        }
      }
    }

    stage('SonarQube') {
      steps {
        withSonarQubeEnv(env.SONAR_NAME) {
          script {
            def scannerHome = tool env.SONAR_INSTALL
            def cmd = [
              "-Dsonar.projectKey=${env.SONAR_PROJECT}",
              "-Dsonar.projectName=PROYECTO FINAL FRONT",
              "-Dsonar.sources=src",
              "-Dsonar.exclusions=node_modules/**,dist/**,coverage/**",
              // si Jest genera cobertura lcov:
              "-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
            ].join(' ')
            if (isUnix()) {
              sh "\"${scannerHome}/bin/sonar-scanner\" ${cmd}"
            } else {
              bat "\"${scannerHome}\\bin\\sonar-scanner.bat\" ${cmd}"
            }
          }
        }
      }
    }
  }

  post {
    success {
      slackSend channel: '#todo-miumg', message: "✅ FRONT QA OK – ${env.JOB_NAME} #${env.BUILD_NUMBER}", color: 'good'
    }
    failure {
      slackSend channel: '#todo-miumg', message: "❌ FRONT QA FALLÓ – ${env.JOB_NAME} #${env.BUILD_NUMBER}", color: 'danger'
    }
  }
}
