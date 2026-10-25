import json
import time
from typing import Optional, Any
from ..core.config import settings

class CacheService:
    def __init__(self):
        self.redis_client = None
        self._memory_cache = {}  # {key: (expires_at, json_string)}
        
        if settings.REDIS_URL:
            try:
                import redis
                self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                print("Connected to Redis caching layer.")
            except Exception as e:
                print(f"Redis connection failed, falling back to in-memory TTL cache: {e}")
                self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception:
                pass

        # In-memory fallback
        if key in self._memory_cache:
            expires_at, data = self._memory_cache[key]
            if time.time() < expires_at:
                return json.loads(data)
            else:
                del self._memory_cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or settings.CACHE_TTL_SECONDS
        json_val = json.dumps(value, default=str)
        
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl, json_val)
                return
            except Exception:
                pass

        # In-memory fallback
        self._memory_cache[key] = (time.time() + ttl, json_val)

    def delete(self, key: str) -> None:
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        """Invalidates all cached keys matching a prefix (e.g., 'treasury:', 'reports:')"""
        if self.redis_client:
            try:
                keys = self.redis_client.keys(f"{prefix}*")
                if keys:
                    self.redis_client.delete(*keys)
            except Exception:
                pass

        keys_to_delete = [k for k in self._memory_cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._memory_cache[k]

cache = CacheService()
