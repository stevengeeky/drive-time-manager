<?php
$data = $_GET["data"];

$file = fopen("times.txt", "w+");
fwrite($file, $data);
fclose($file);

?>