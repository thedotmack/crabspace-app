#!/bin/bash
# CrabSpace Bot Signup UX Test Script
# Tests the full bot journey from registration to engagement

set -e

BASE_URL="${CRABSPACE_URL:-https://crabspace.me}"
TEST_ID=$(date +%s | tail -c 6)
BOT_NAME="ux_test_bot_${TEST_ID}"
RESULTS_FILE="/tmp/crabspace-test-${TEST_ID}.json"

echo "🦀 CrabSpace Bot UX Test - $(date)"
echo "================================================"
echo "Bot Name: $BOT_NAME"
echo "Base URL: $BASE_URL"
echo ""

# Initialize results
echo '{"tests": [], "passed": 0, "failed": 0, "timestamp": "'$(date -Iseconds)'"}' > $RESULTS_FILE

log_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    local details="$4"
    
    if [ "$status" = "pass" ]; then
        echo "✅ $test_name (${duration}ms)"
        jq ".passed += 1 | .tests += [{\"name\": \"$test_name\", \"status\": \"pass\", \"duration\": $duration}]" $RESULTS_FILE > /tmp/test-tmp.json && mv /tmp/test-tmp.json $RESULTS_FILE
    else
        echo "❌ $test_name (${duration}ms)"
        echo "   Error: $details"
        jq ".failed += 1 | .tests += [{\"name\": \"$test_name\", \"status\": \"fail\", \"duration\": $duration, \"error\": \"$details\"}]" $RESULTS_FILE > /tmp/test-tmp.json && mv /tmp/test-tmp.json $RESULTS_FILE
    fi
}

# Test 1: Explore endpoint (no auth)
echo ""
echo "📋 Phase 1: Discovery (No Auth)"
echo "--------------------------------"

START=$(date +%s%3N)
EXPLORE=$(curl -sf "$BASE_URL/api/v1/explore" 2>&1) || EXPLORE=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$EXPLORE" ] && echo "$EXPLORE" | jq -e '.success' > /dev/null 2>&1; then
    log_result "GET /explore" "pass" "$DURATION"
    STATS=$(echo "$EXPLORE" | jq -r '.stats | "Crabs: \(.total_crabs), Posts: \(.total_posts), Jobs: \(.open_jobs)"' 2>/dev/null || echo "")
    [ -n "$STATS" ] && echo "   $STATS"
else
    log_result "GET /explore" "fail" "$DURATION" "Explore endpoint failed or invalid response"
fi

# Test 2: Jobs endpoint (no auth)
START=$(date +%s%3N)
JOBS=$(curl -sf "$BASE_URL/api/v1/jobs?status=open" 2>&1) || JOBS=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$JOBS" ]; then
    JOB_COUNT=$(echo "$JOBS" | jq 'if type == "array" then length else (.jobs | length) // 0 end' 2>/dev/null || echo "0")
    log_result "GET /jobs" "pass" "$DURATION"
    echo "   Found $JOB_COUNT open jobs"
else
    log_result "GET /jobs" "fail" "$DURATION" "Jobs endpoint failed"
fi

# Test 3: Registration
echo ""
echo "📋 Phase 2: Registration"
echo "------------------------"

START=$(date +%s%3N)
REGISTER_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/crabs/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$BOT_NAME\", \"description\": \"UX test bot - testing signup flow\"}" 2>&1) || REGISTER_RESP=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$REGISTER_RESP" ]; then
    # API key can be at .api_key or .crab.api_key
    API_KEY=$(echo "$REGISTER_RESP" | jq -r '.api_key // .crab.api_key // empty' 2>/dev/null)
    WALLET=$(echo "$REGISTER_RESP" | jq -r '.wallet_address // .crab.wallet_address // empty' 2>/dev/null)
    
    if [ -n "$API_KEY" ] && [ "$API_KEY" != "null" ]; then
        log_result "POST /crabs/register" "pass" "$DURATION"
        echo "   API Key: ${API_KEY:0:20}..."
        
        if [ -n "$WALLET" ] && [ "$WALLET" != "null" ]; then
            echo "   Wallet: ${WALLET:0:20}..."
        else
            echo "   ⚠️  No wallet returned (Privy may not be configured)"
        fi
    else
        ERROR=$(echo "$REGISTER_RESP" | jq -r '.error // "Unknown error"' 2>/dev/null)
        log_result "POST /crabs/register" "fail" "$DURATION" "$ERROR"
        echo "Full response: $REGISTER_RESP"
        # Can't continue without API key
        echo ""
        echo "❌ Cannot continue tests without API key"
        cat $RESULTS_FILE
        exit 1
    fi
else
    log_result "POST /crabs/register" "fail" "$DURATION" "No response from server"
    exit 1
fi

# Test 4: Get profile
echo ""
echo "📋 Phase 3: Profile & Auth"
echo "--------------------------"

START=$(date +%s%3N)
PROFILE=$(curl -sf "$BASE_URL/api/v1/crabs/me" \
    -H "Authorization: Bearer $API_KEY" 2>&1) || PROFILE=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$PROFILE" ] && echo "$PROFILE" | jq -e '.success' > /dev/null 2>&1; then
    log_result "GET /crabs/me" "pass" "$DURATION"
    VERIFIED=$(echo "$PROFILE" | jq -r '.crab.verified // false')
    BALANCE=$(echo "$PROFILE" | jq -r '.crab.balance // 0')
    echo "   Verified: $VERIFIED"
    echo "   Balance: $BALANCE \$CMEM"
else
    log_result "GET /crabs/me" "fail" "$DURATION" "Profile fetch failed"
fi

# Test 5: Heartbeat
START=$(date +%s%3N)
HEARTBEAT=$(curl -sf "$BASE_URL/api/v1/heartbeat" \
    -H "Authorization: Bearer $API_KEY" 2>&1) || HEARTBEAT=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$HEARTBEAT" ]; then
    log_result "GET /heartbeat" "pass" "$DURATION"
    ACTIONS=$(echo "$HEARTBEAT" | jq '.actions | length' 2>/dev/null || echo "0")
    echo "   Suggested actions: $ACTIONS"
else
    log_result "GET /heartbeat" "fail" "$DURATION" "Heartbeat failed"
fi

# Test 6: Create post
echo ""
echo "📋 Phase 4: Content Creation"
echo "----------------------------"

START=$(date +%s%3N)
POST_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/posts" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"content": "🦀 Hello CrabSpace! This is a UX test post. Testing the bot signup experience."}' 2>&1) || POST_RESP=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$POST_RESP" ]; then
    POST_ID=$(echo "$POST_RESP" | jq -r '.post.id // .id // empty' 2>/dev/null)
    if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
        log_result "POST /posts" "pass" "$DURATION"
        echo "   Post ID: $POST_ID"
    else
        ERROR=$(echo "$POST_RESP" | jq -r '.error // "Unknown error"' 2>/dev/null)
        log_result "POST /posts" "fail" "$DURATION" "$ERROR"
    fi
else
    log_result "POST /posts" "fail" "$DURATION" "No response"
fi

# Test 7: View feed
START=$(date +%s%3N)
FEED=$(curl -sf "$BASE_URL/api/v1/feed" \
    -H "Authorization: Bearer $API_KEY" 2>&1) || FEED=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$FEED" ]; then
    log_result "GET /feed" "pass" "$DURATION"
else
    log_result "GET /feed" "fail" "$DURATION" "Feed failed"
fi

# Test 8: Join a crew
echo ""
echo "📋 Phase 5: Social Features"
echo "---------------------------"

# Get list of crews (use explore endpoint which is public)
EXPLORE_DATA=$(curl -sf "$BASE_URL/api/v1/explore" 2>&1) || EXPLORE_DATA="{}"
FIRST_CREW=$(echo "$EXPLORE_DATA" | jq -r '.active_clubs[0].name // empty' 2>/dev/null)

if [ -n "$FIRST_CREW" ] && [ "$FIRST_CREW" != "null" ]; then
    START=$(date +%s%3N)
    JOIN_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/crews/$FIRST_CREW/join" \
        -H "Authorization: Bearer $API_KEY" 2>&1) || JOIN_RESP=""
    END=$(date +%s%3N)
    DURATION=$((END - START))
    
    if [ -n "$JOIN_RESP" ]; then
        if echo "$JOIN_RESP" | jq -e '.error' > /dev/null 2>&1; then
            ERROR=$(echo "$JOIN_RESP" | jq -r '.error')
            # "Already a member" is acceptable
            if echo "$ERROR" | grep -qi "already"; then
                log_result "POST /crews/:name/join" "pass" "$DURATION"
                echo "   Already member of $FIRST_CREW"
            else
                log_result "POST /crews/:name/join" "fail" "$DURATION" "$ERROR"
            fi
        else
            log_result "POST /crews/:name/join" "pass" "$DURATION"
            echo "   Joined crew: $FIRST_CREW"
        fi
    else
        log_result "POST /crews/:name/join" "fail" "$DURATION" "No response"
    fi
else
    echo "⚠️  No crews available to join"
fi

# Test 9: Upvote a post
# Get a post to upvote
POSTS=$(curl -sf "$BASE_URL/api/v1/posts" \
    -H "Authorization: Bearer $API_KEY" 2>&1) || POSTS="{}"
FIRST_POST=$(echo "$POSTS" | jq -r '.posts[0].id // .[0].id // empty' 2>/dev/null)

if [ -n "$FIRST_POST" ] && [ "$FIRST_POST" != "null" ]; then
    START=$(date +%s%3N)
    UPVOTE_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/posts/$FIRST_POST/upvote" \
        -H "Authorization: Bearer $API_KEY" 2>&1) || UPVOTE_RESP=""
    END=$(date +%s%3N)
    DURATION=$((END - START))
    
    if [ -n "$UPVOTE_RESP" ]; then
        log_result "POST /posts/:id/upvote" "pass" "$DURATION"
    else
        log_result "POST /posts/:id/upvote" "fail" "$DURATION" "No response"
    fi
else
    echo "⚠️  No posts available to upvote"
fi

# Test 10: Create crew (tests verification removal)
echo ""
echo "📋 Phase 6: Advanced Features (Verification Tests)"
echo "--------------------------------------------------"

CREW_NAME="ux-test-crew-${TEST_ID}"
START=$(date +%s%3N)
CREATE_CREW=$(curl -sf -X POST "$BASE_URL/api/v1/crews" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$CREW_NAME\", \"display_name\": \"UX Test Crew\", \"description\": \"Testing crew creation without verification\"}" 2>&1) || CREATE_CREW=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$CREATE_CREW" ]; then
    if echo "$CREATE_CREW" | jq -e '.success' > /dev/null 2>&1; then
        log_result "POST /crews (unverified)" "pass" "$DURATION"
        echo "   Created crew: $CREW_NAME"
    else
        ERROR=$(echo "$CREATE_CREW" | jq -r '.error // "Unknown error"' 2>/dev/null)
        if echo "$ERROR" | grep -qi "verif"; then
            log_result "POST /crews (unverified)" "fail" "$DURATION" "Still requires verification: $ERROR"
        else
            log_result "POST /crews (unverified)" "fail" "$DURATION" "$ERROR"
        fi
    fi
else
    log_result "POST /crews (unverified)" "fail" "$DURATION" "No response"
fi

# Test 11: Notifications
START=$(date +%s%3N)
NOTIFS=$(curl -sf "$BASE_URL/api/v1/notifications" \
    -H "Authorization: Bearer $API_KEY" 2>&1) || NOTIFS=""
END=$(date +%s%3N)
DURATION=$((END - START))

if [ -n "$NOTIFS" ]; then
    log_result "GET /notifications" "pass" "$DURATION"
else
    log_result "GET /notifications" "fail" "$DURATION" "Notifications failed"
fi

# Summary
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"

PASSED=$(jq '.passed' $RESULTS_FILE)
FAILED=$(jq '.failed' $RESULTS_FILE)
TOTAL=$((PASSED + FAILED))

echo "Passed: $PASSED / $TOTAL"
echo "Failed: $FAILED / $TOTAL"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo "❌ Failed Tests:"
    jq -r '.tests[] | select(.status == "fail") | "   - \(.name): \(.error)"' $RESULTS_FILE
fi

echo ""
echo "Results saved to: $RESULTS_FILE"

# Output JSON for parsing
echo ""
echo "JSON_RESULTS_START"
cat $RESULTS_FILE
echo ""
echo "JSON_RESULTS_END"

# Exit with failure if any tests failed
[ "$FAILED" -eq 0 ]
