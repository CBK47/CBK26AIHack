import subprocess
import time

def press_return():
    script = 'tell application "System Events" to key code 36'
    subprocess.run(["osascript", "-e", script])

print("Pressing return in 3 seconds...")
time.sleep(3)
press_return()
print("Done!")
