<?php
$filename = "times.txt";
$file = fopen($filename, "r");
$text = fread($file, filesize($filename));
fclose($file);

die($text);

?>