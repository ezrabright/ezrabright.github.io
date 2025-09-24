<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // If using Composer, or include PHPMailer files manually

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name    = htmlspecialchars($_POST['name']);
    $email   = htmlspecialchars($_POST['email']);
    $subject = htmlspecialchars($_POST['subject']);
    $message = htmlspecialchars($_POST['message']);

    $mail = new PHPMailer(true);

    try {
        // SMTP settings
        $mail->isSMTP();
        $mail->Host       = 'mail.ezrabright.co.za';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'leads@ezrabright.co.za'; // Your email
        $mail->Password   = 'Innocent@2240';    // Your email password
        $mail->SMTPSecure = 'ssl'; // or 'tls' if 465 doesn’t work
        $mail->Port       = 465;

        // Sender & Recipient
        $mail->setFrom('leads@ezrabright.co.za', 'EzraBright Website');
        $mail->addAddress('leads@ezrabright.co.za'); // Where you receive it

        // Email content
        $mail->isHTML(true);
        $mail->Subject = "New Contact Form Submission: $subject";
        $mail->Body    = "
            <h3>New Message from Website</h3>
            <p><b>Name:</b> $name</p>
            <p><b>Email:</b> $email</p>
            <p><b>Message:</b><br>$message</p>
        ";

        $mail->send();
        echo "success";
    } catch (Exception $e) {
        echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
}
?>
