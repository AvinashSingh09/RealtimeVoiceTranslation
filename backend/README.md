# Backend Setup

## Google Cloud Credentials

To run this application, you need to set up Google Cloud credentials.

1.  Create a Service Account in your Google Cloud Console.
2.  Download the JSON key file for the service account.
3.  Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your JSON key file.

**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\key.json"
```

**Linux/macOS:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/key.json"
```

## Running the Application

```bash
mvn spring-boot:run
```
