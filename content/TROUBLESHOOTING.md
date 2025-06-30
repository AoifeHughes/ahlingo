# Troubleshooting Guide - Outlines Integration

## 🚨 Common Issues and Solutions

### 1. Model Connection Issues

#### Problem: Connection Refused
```
ConnectionError: Connection refused to localhost:11434
```

**Solution:**
```bash
# Start Ollama server
ollama serve

# Verify server is running
curl http://localhost:11434/v1/models
```

#### Problem: Model Not Found
```
Error: Model 'qwen/qwen3-4b' not found
```

**Solution:**
```bash
# Pull the model
ollama pull qwen:3-4b

# Or use a different available model
ollama list
```

#### Problem: Model Loading Timeout
```
TimeoutError: Model loading exceeded timeout
```

**Solution:**
- Ensure sufficient RAM (8GB+ recommended for qwen:3-4b)
- Try a smaller model like `qwen:1.8b`
- Increase timeout in model setup

### 2. Generation Issues

#### Problem: Empty Results
```python
result = generate_conversations(model, 'French', 'beginner', 'food')
# result is empty or None
```

**Debugging Steps:**
```python
# 1. Test model connection
model = setup_outlines_model()
print("Model type:", type(model))

# 2. Test simple generation
generator = outlines.generate.text(model)
simple_result = generator("Say hello in French")
print("Simple generation:", simple_result)

# 3. Check schema
schema = '{"type": "object", "properties": {"test": {"type": "string"}}}'
json_generator = outlines.generate.json(model, schema)
json_result = json_generator("Generate test JSON")
print("JSON generation:", json_result)
```

#### Problem: Repetitive Content
Even with improvements, if you still see repetition:

**Solution:**
```python
# Adjust temperature/parameters
# In outlines_generator.py, modify the generation call:
result = generator(prompt, max_tokens=1000, temperature=0.8)
```

### 3. Database Issues

#### Problem: Database Locked
```
sqlite3.OperationalError: database is locked
```

**Solution:**
```python
# Close any existing connections
db.close()

# Or use with statement for automatic cleanup
with LanguageDB(db_path) as db:
    # Your operations here
    pass
```

#### Problem: Duplicate Exercises
If you see identical exercises being generated:

**Check:**
```sql
SELECT exercise_name, COUNT(*) 
FROM exercises_info 
GROUP BY exercise_name 
HAVING COUNT(*) > 1;
```

**Solution:**
- Clear and regenerate database
- Check lesson_id uniqueness
- Verify N_runs parameter

### 4. Performance Issues

#### Problem: Slow Generation
Generation taking too long per exercise:

**Optimizations:**
```python
# 1. Reuse model (already implemented)
model = setup_outlines_model()  # Once
for combination in combinations:
    generate_lessons_data_structured(..., model=model)

# 2. Reduce N_runs for testing
generate_lessons_data_structured(..., N_runs=1)

# 3. Test single combinations first
for lesson_kind, lesson_id, json_response in generate_lessons_data_structured(
    "French", "beginner", "food", N_runs=1, lesson_kinds=["pairs"]
):
    print(f"Generated {lesson_kind}")
```

#### Problem: Memory Issues
System running out of memory:

**Solutions:**
- Use smaller model (qwen:1.8b instead of qwen:3-4b)
- Process fewer combinations at once
- Increase system swap space
- Close other applications

### 5. JSON Schema Issues

#### Problem: Schema Validation Errors
```
ValueError: Cannot parse schema
```

**Debug Schema:**
```python
# Test schema manually
import json
schema_str = f'''{{
    "type": "array",
    "items": {{
        "type": "object",
        "properties": {{
            "English": {{"type": "string"}},
            "{language}": {{"type": "string"}}
        }},
        "required": ["English", "{language}"]
    }}
}}'''

# Validate JSON
try:
    schema_obj = json.loads(schema_str)
    print("Schema valid:", schema_obj)
except json.JSONDecodeError as e:
    print("Schema error:", e)
```

### 6. Import Issues

#### Problem: Module Not Found
```python
ImportError: cannot import name 'generate_lessons_data_structured'
```

**Check:**
```python
# Verify file structure
import os
print("Files in content_creation:")
print(os.listdir("content_creation/"))

# Check imports
from content_creation import outlines_generator
print("Available functions:", dir(outlines_generator))
```

## 🔧 Debugging Tools

### Quick Test Script
```python
#!/usr/bin/env python3
"""Quick diagnostic script"""

def run_diagnostics():
    print("🔍 Running Outlines Integration Diagnostics")
    
    # 1. Check Ollama connection
    try:
        import requests
        response = requests.get("http://localhost:11434/v1/models")
        print("✅ Ollama server accessible")
        print(f"Available models: {len(response.json()['data'])}")
    except Exception as e:
        print("❌ Ollama server issue:", e)
        return
    
    # 2. Test model setup
    try:
        from content_creation.outlines_generator import setup_outlines_model
        model = setup_outlines_model()
        print("✅ Model setup successful")
    except Exception as e:
        print("❌ Model setup failed:", e)
        return
    
    # 3. Test generation
    try:
        from content_creation.outlines_generator import generate_pairs
        result = generate_pairs(model, "French", "beginner", "test")
        print(f"✅ Generation successful: {len(result)} pairs")
    except Exception as e:
        print("❌ Generation failed:", e)
        return
    
    print("🎉 All diagnostics passed!")

if __name__ == "__main__":
    run_diagnostics()
```

### Performance Monitor
```python
import time
import psutil

def monitor_generation():
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    # Your generation code here
    result = generate_conversations(model, "French", "beginner", "food")
    
    end_time = time.time()
    end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    print(f"Generation time: {end_time - start_time:.2f}s")
    print(f"Memory usage: {end_memory - start_memory:.1f}MB increase")
    print(f"Results: {len(result)} exercises")
```

## 📞 Getting Help

### Check Logs
1. **Console output** for immediate errors
2. **Database content** to verify results
3. **Model responses** for quality issues

### Test in Isolation
```python
# Test each component separately
# 1. Model connection
# 2. Schema validation  
# 3. Single generation
# 4. Database insertion
```

### Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Connection refused | `ollama serve` |
| Model not found | `ollama pull qwen:3-4b` |
| Empty results | Check model status |
| Slow generation | Use smaller model |
| Memory issues | Reduce batch size |
| Schema errors | Validate JSON format |

## 🛠️ Emergency Fallback

If Outlines integration fails completely:

```python
# Use legacy method
from content_creation.generate_lessons import populate_database_legacy
populate_database_legacy()
```

This provides a stable fallback while debugging the Outlines integration.

---

*For persistent issues, review the generation logs and test with single combinations first.*