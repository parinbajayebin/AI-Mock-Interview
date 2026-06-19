import os
from jose import jwt

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranNyamlicnB4cHdnbHpycm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTc3OTcsImV4cCI6MjA5NzI3Mzc5N30.yppyRCNsFVHhyX8O_aJNoCYH65N0swSh5wSE1mML4XQ"
secret = "Vp4UHoYSbLIGQ278CvV2V0/ItyYH4r1tHyeEUOKGhcku8QW6uHxkgQsOS+yOlPbZqyILEBxitlK8xMvyDJvZVg=="

try:
    decoded = jwt.decode(anon_key, secret, algorithms=["HS256"], audience=None)
    print("SUCCESS DECODING WITH STRING:", decoded)
except Exception as e:
    print("FAILED DECODING WITH STRING:", type(e), e)

try:
    print("Trying with base64 decoded secret...")
    import base64
    secret_bytes = base64.b64decode(secret)
    print("Secret bytes len:", len(secret_bytes))
    decoded2 = jwt.decode(anon_key, secret_bytes, algorithms=["HS256"], audience=None)
    print("SUCCESS DECODING WITH BASE64 BYTES:", decoded2)
except Exception as e:
    print("FAILED DECODING WITH BYTES:", type(e), e)
