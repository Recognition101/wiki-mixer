#!/usr/bin/env python
from optparse import OptionParser
import os
import subprocess
import re

parser = OptionParser(description="" +
        "This processor gathers files in a directory and passes them " +
        "into the closure compiler. Note that files that end in " +
        ".extern.js are treated as externs rather than JS files.")
parser.add_option("-c", "--compiler", dest="compiler",
                  help="The path to the closure compiler jar. By default, " +
                       "it is set to ./build/compiler.jar.",
                  default="./build/compiler.jar")
parser.add_option("-s", "--src", dest="src",
                  help="The path to the root directory containing all the " +
                       "JS files and externs. By default it is ./js/.",
                  default="./js")
parser.add_option("-o", "--output", dest="output",
                  help="The file to write the output of the compilation to. " +
                       "By default it is ./script.js",
                  default="./script.js")
parser.add_option("-i", "--index", dest="index",
                  help="The debug index file template that is used to " +
                       "the properly linked index file. This builder will " +
                       "automatically look for <!-- SCRIPT-BLOCK -->  and " +
                       "<!-- END-SCRIPT-BLOCK --> and replace what is " +
                       "between those comments with a single reference " +
                       "to the newly created compiled script. Note that " +
                       "this file must end with _debug.html, as the final " +
                       "HTML file will be named the same as this argument " +
                       "except with _debug.html replaced by just .html. By " +
                       "default this is set to index_debug.html.",
                  default="./index_debug.html")

(options, args) = parser.parse_args()

if not os.path.exists(options.compiler):
    print "ERROR: File not found: [%s]" % options.compiler
    exit()

if not os.path.exists(options.src) or not os.path.isdir(options.src):
    print "ERROR: src path not found or is file: [%s]" % options.compiler
    exit()

if not os.path.exists(options.index) or \
        not options.index.endswith("_debug.html"):
    print "ERROR: File not found or is not _debug.html: [%s]" % options.index
    exit()

jsFiles = []
externs = []
main = ""

for root, dirs, files in os.walk(options.src):
    for name in files:
        fn = os.path.join(root, name)
        if name.endswith("main.js"):
            main = fn
        if name.endswith(".externs.js"):
            externs.append(fn)
        elif name.endswith(".js"):
            jsFiles.append(fn)

    if ".svn" in dirs:
        dirs.remove(".svn")
    if ".git" in dirs:
        dirs.remove(".git")
    if "CVS" in dirs:
        dirs.remove("CVS")

args = ["java", "-jar", os.path.abspath(options.compiler)]
for jsFile in jsFiles:
    args.append("--js")
    args.append(jsFile)

for extern in externs:
    args.append("--externs")
    args.append(extern)

if main != "":
    args.append("--common_js_entry_module")
    args.append(main)

args.append("--js_output_file")
args.append(os.path.abspath(options.output))

args.append("--compilation_level")
args.append("ADVANCED_OPTIMIZATIONS")

args.append("--warning_level")
args.append("VERBOSE")

args.append("--create_source_map")
args.append(os.path.abspath(options.output + ".map"))

args.append("--source_map_format=V3")

subprocess.call(args)

# Write sourcemap comment to end of generated script file
hasLine = True
specialLine = "//@ sourceMappingURL=%s" % options.output + ".map"
try:
    with open(options.output, "r") as f:
        for line in f:
            hasLine = line == specialLine

    if not hasLine:
        with open(options.output, "a") as f:
            f.write(specialLine)

except IOError as e:
    print "ERROR: Could not open file %s for read/write" % options.output


#write out index.html file
newFile = options.index.replace("_debug", "")
try:
    txt = ""
    with open(options.index, "r") as f:
        txt = f.read()

    repl = "\n\n\n\n\n\n\n\n\n\n\n\n        " + \
           "<!-- WARNING: %s IS GENERATED, DO NOT EDIT -->" % newFile + \
           "\n\n        " + \
           "<!-- PLEASE EDIT %s INSTEAD -->" % options.index + \
           "\n\n        " + \
           "<!-- USE build.sh TO MAKE THIS FILE FROM %s -->" % \
                options.index + \
           "\n\n\n\n\n\n\n\n\n\n\n\n        "
    repl += "<script type=\"text/javascript\" src=\"%s\"></script>" % \
                options.output

    txt = re.sub("<!-- SCRIPT-BLOCK -->.*<!-- END-SCRIPT-BLOCK -->",
                 repl, txt, flags=re.MULTILINE | re.DOTALL)
    with open(newFile, "w") as f:
        f.write(txt)

except IOError as e:
    print "ERROR: Could not read %s or %s" % (options.index, newFile)
