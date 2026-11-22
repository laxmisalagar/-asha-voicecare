Set ws = CreateObject("WScript.Shell")
ws.Run "python ""C:\Users\KIRAN S\ashavoicecare\backend\main.py""", 0, False
WScript.Sleep 2000
MsgBox "Backend started", 64, "ASHA VoiceCare"