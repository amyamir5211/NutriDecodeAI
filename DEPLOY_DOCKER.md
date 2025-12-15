# Docker Deployment Guide for NutriDecode AI

Depending on whether you have `docker-compose` or just `docker` installed, choose the method below.

## Prerequisites
- Docker Engine installed.
- Your Gemini API Key ready.

## Method 1: Using Docker Compose (Recommended)

1.  **Create a `.env` file** (if you haven't already) in the root directory with your key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

2.  **Build and Run**:
    Open your terminal in the project folder and run:
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the App**:
    Go to [http://localhost:8080](http://localhost:8080).

## Method 2: Manual Docker Build

1.  **Build the Image**:
    Replace `your_key_here` with your actual API key.
    ```bash
    docker build --build-arg GEMINI_API_KEY=your_key_here -t nutridecode-ai .
    ```

2.  **Run the Container**:
    ```bash
    docker run -d -p 8080:80 --name nutridecode-container nutridecode-ai
    ```

3.  **Access**:
    Go to [http://localhost:8080](http://localhost:8080).

## Troubleshooting
- If the API calls fail, ensure the API Key was correctly passed during the **build** step. Note that Vite embeds the key into the HTML/JS at build time, so changing the key requires rebuilding the image.
