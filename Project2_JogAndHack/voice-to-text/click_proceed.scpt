tell application "System Events"
    try
        # Try to generically click any UI element named "Proceed"
        click (first UI element of (every process) whose name is "Proceed")
    on error
        display notification "Could not find a Proceed button to click." with title "Voice Control"
    end try
end tell
