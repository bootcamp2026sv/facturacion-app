Option Explicit

Dim shell, filesystem, scriptDir, command
Set shell = CreateObject("WScript.Shell")
Set filesystem = CreateObject("Scripting.FileSystemObject")

scriptDir = filesystem.GetParentFolderName(WScript.ScriptFullName)
command = "cmd.exe /c """ & scriptDir & "\iniciar-frontend.cmd"""
shell.Run command, 0, False
