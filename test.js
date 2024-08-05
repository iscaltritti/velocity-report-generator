import inspector from 'inspector';
function isDebuggerAttached() {
    return inspector.url() !== undefined;
}

if (isDebuggerAttached()) {
    console.log("Debugger is attached.");
} else {
    console.log("Debugger is not attached.");
}
