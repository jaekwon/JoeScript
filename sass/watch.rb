# Watches ./wp-content/themes/**/*.scss for changes and recompiles
# them into css files in the same place.
# 
# Installation:
#   [sudo] gem install watchr
# 
# Usage:
#   watchr ./path/to/this/script.rb
# 
# ^C to exit.
# 

watch('sass/.*?\.scss') do |md|
  input = md[0] # wp-content/themes/sometheme/main.scss
  output = 'static/'+input.gsub('.scss', '.css')[5..-1]
  command = "sass #{input} #{output}"
  %x{#{command}}
  puts "SASSy regenerated #{input} to #{output}: #{command}"
end
