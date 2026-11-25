#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
JAVAC_BIN="/opt/homebrew/opt/openjdk@21/bin/javac"
JAVA_BIN="/opt/homebrew/opt/openjdk@21/bin/java"
if [ ! -x "$JAVAC_BIN" ]; then
  JAVAC_BIN="javac"
  JAVA_BIN="java"
fi

mkdir -p "$DIR/target/classes"
"$JAVAC_BIN" -d "$DIR/target/classes" $(find "$DIR/src/main/java" -name "*.java")
exec "$JAVA_BIN" -cp "$DIR/target/classes" uz.tpu.dormitory.SmartDormitoryApplication
