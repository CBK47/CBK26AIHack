tell application "System Events"
    try
        # Try to generically click any UI element named "Confirm"
        click (first UI element of (every process) whose name is "Confirm")
    on error
        display notification "Could not find a Confirm button to click." with title "Voice Control"
    end try
end tell
