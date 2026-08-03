#!/usr/bin/env bash

set +e

OUT="${GITHUB_WORKSPACE}/build/startup-smoke"
APK="${GITHUB_WORKSPACE}/build/qa-apk/neofit-stage9-qa.apk"
PACKAGE='com.emad211.neofit'

mkdir -p "$OUT"
adb wait-for-device
adb logcat -c
adb install -r "$APK" > "$OUT/install.txt" 2>&1
INSTALL_STATUS=$?
echo "installStatus=$INSTALL_STATUS" > "$OUT/result.txt"

adb shell am force-stop "$PACKAGE"
adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 > "$OUT/launch.txt" 2>&1
LAUNCH_STATUS=$?
echo "launchStatus=$LAUNCH_STATUS" >> "$OUT/result.txt"

SEEN=0
DIED=0
FINAL_PID=''
for SECOND in $(seq 1 60); do
  PID="$(adb shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r')"
  printf '%s\t%s\n' "$SECOND" "${PID:-none}" >> "$OUT/process-timeline.tsv"
  if [ -n "$PID" ]; then
    SEEN=1
    FINAL_PID="$PID"
  elif [ "$SEEN" -eq 1 ]; then
    DIED=1
    break
  fi
  sleep 1
done

adb shell dumpsys activity activities > "$OUT/activities.txt" 2>&1
adb shell dumpsys activity top > "$OUT/activity-top.txt" 2>&1
adb shell dumpsys meminfo "$PACKAGE" > "$OUT/meminfo.txt" 2>&1
adb shell dumpsys package "$PACKAGE" > "$OUT/package.txt" 2>&1
adb shell dumpsys dropbox --print data_app_crash > "$OUT/dropbox-data-app-crash.txt" 2>&1
adb shell dumpsys dropbox --print system_app_crash > "$OUT/dropbox-system-app-crash.txt" 2>&1
adb logcat -d -v threadtime > "$OUT/logcat-full.txt" 2>&1
grep -E 'AndroidRuntime|FATAL EXCEPTION|ReactNativeJS|libc|DEBUG|OutOfMemory|ANR|com\.emad211\.neofit|Application initialization failed' "$OUT/logcat-full.txt" > "$OUT/logcat-focused.txt" 2>/dev/null || true
adb exec-out screencap -p > "$OUT/screenshot.png" 2>/dev/null || true
adb shell uiautomator dump /sdcard/neofit-window.xml > "$OUT/uiautomator-command.txt" 2>&1 || true
adb pull /sdcard/neofit-window.xml "$OUT/window.xml" > "$OUT/uiautomator-pull.txt" 2>&1 || true

INIT_ERROR=0
grep -q 'Application initialization failed' "$OUT/logcat-full.txt" && INIT_ERROR=1

echo "seen=$SEEN" >> "$OUT/result.txt"
echo "died=$DIED" >> "$OUT/result.txt"
echo "initializationError=$INIT_ERROR" >> "$OUT/result.txt"
echo "finalPid=${FINAL_PID:-none}" >> "$OUT/result.txt"

if [ "$INSTALL_STATUS" -ne 0 ]; then
  echo 'status=install_failed' >> "$OUT/result.txt"
elif [ "$SEEN" -eq 0 ]; then
  echo 'status=never_started' >> "$OUT/result.txt"
elif [ "$DIED" -eq 1 ]; then
  echo 'status=crashed' >> "$OUT/result.txt"
elif [ "$INIT_ERROR" -eq 1 ]; then
  echo 'status=initialization_error' >> "$OUT/result.txt"
else
  echo 'status=alive_after_60s' >> "$OUT/result.txt"
fi

cat "$OUT/result.txt"
exit 0
