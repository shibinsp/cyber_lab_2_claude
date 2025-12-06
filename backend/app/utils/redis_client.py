"""
Redis Client Utility
Handles Redis connections and common caching operations
"""
import os
import json
import logging
from typing import Optional, Any, Dict
import redis
from redis.exceptions import ConnectionError, TimeoutError

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client wrapper with connection pooling and error handling"""
    
    def __init__(self):
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self.db = int(os.getenv("REDIS_DB", "0"))
        self.client: Optional[redis.Redis] = None
        self._connect()
    
    def _connect(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            self.client.ping()
            logger.info(f"✅ Redis connected: {self.host}:{self.port}/{self.db}")
        except (ConnectionError, TimeoutError) as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Running without cache.")
            self.client = None
        except Exception as e:
            logger.error(f"❌ Redis initialization error: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if not self.client:
            return False
        try:
            self.client.ping()
            return True
        except:
            return False
    
    def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        if not self.is_connected():
            return None
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: str, ttl: int = 3600) -> bool:
        """Set value in Redis with TTL"""
        if not self.is_connected():
            return False
        try:
            return self.client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        if not self.is_connected():
            return False
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.is_connected():
            return False
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    def get_json(self, key: str) -> Optional[Dict]:
        """Get JSON value from Redis"""
        value = self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON for key {key}")
                return None
        return None
    
    def set_json(self, key: str, value: Dict, ttl: int = 3600) -> bool:
        """Set JSON value in Redis"""
        try:
            json_str = json.dumps(value)
            return self.set(key, json_str, ttl)
        except (TypeError, ValueError) as e:
            logger.error(f"JSON serialization error for key {key}: {e}")
            return False
    
    def get_hash(self, key: str) -> Optional[Dict[str, str]]:
        """Get hash from Redis"""
        if not self.is_connected():
            return None
        try:
            return self.client.hgetall(key)
        except Exception as e:
            logger.error(f"Redis HGETALL error for key {key}: {e}")
            return None
    
    def set_hash(self, key: str, value: Dict[str, str], ttl: int = 3600) -> bool:
        """Set hash in Redis"""
        if not self.is_connected():
            return False
        try:
            self.client.hset(key, mapping=value)
            if ttl > 0:
                self.client.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Redis HSET error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.is_connected():
            return 0
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis DELETE pattern error for {pattern}: {e}")
            return 0
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a counter"""
        if not self.is_connected():
            return None
        try:
            return self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis INCR error for key {key}: {e}")
            return None
    
    def expire(self, key: str, ttl: int) -> bool:
        """Set TTL on existing key"""
        if not self.is_connected():
            return False
        try:
            return bool(self.client.expire(key, ttl))
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False

# Global Redis client instance
redis_client = RedisClient()

