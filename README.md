import jwt
import datetime
from config.config import SECRET_KEY

def generate_token(payload, expiration_minutes=60):
    """
    Generate a JWT token.
    :param payload: The data to include in the token.
    :param expiration_minutes: Token expiration time in minutes.
    :return: Encoded JWT token.
    """
    try:
        payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiration_minutes)
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return token
    except Exception as e:
        print(f"Token generation error: {e}")
        return None

def validate_token(token):
    """
    Validate a JWT token.
    :param token: The JWT token to validate.
    :return: Decoded payload if valid, None otherwise.
    """
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        print("Token has expired.")
        return None
    except jwt.InvalidTokenError:
        print("Invalid token.")
        return None
