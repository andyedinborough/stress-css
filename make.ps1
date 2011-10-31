function minify-js($js) {
    $web =  new-object System.Net.WebClient
    $js = [System.Uri]::EscapeDataString($js)
    $web.Headers.Add("content-type", "application/x-www-form-urlencoded")
    $post = "output_format=text&output_info=compiled_code&compilation_level=SIMPLE_OPTIMIZATIONS&js_code=$js"
    $js = $web.UploadString("http://closure-compiler.appspot.com/compile", $post)
    return $js
}

function build-parser() {
    $parseCSS = [System.IO.File]::ReadAllText((absolute-ref("parseCSS.js")))
    $reader = [System.IO.File]::ReadAllText((absolute-ref("reader.js")))
    
    $all = "var parseCSS = (function(){ 
        $reader
        $parseCSS 
        return parseCSS; 
})();";

    $allmin = minify-js($all)
    
    [System.IO.File]::WriteAllText((absolute-ref("bin\\parseCSS.js")), $all)
    [System.IO.File]::WriteAllText((absolute-ref("bin\\parseCSS.min.js")), $allmin)
}

function absolute-ref ($file) {
    return [System.IO.Path]::Combine([System.Environment]::CurrentDirectory, $file)
}

build-parser