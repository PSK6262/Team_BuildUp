package com.app.util;

import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@PropertySource("classpath:config/smtp.properties")
public class SendMail {

	@Autowired
	private JavaMailSender mailSender;

	@Value("${mail.username}")
	private String fromEmail;

	public boolean send(String toEmail, String title, String content) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

			helper.setFrom(fromEmail, "PL:UG");
			helper.setTo(toEmail);
			helper.setSubject(title);
			helper.setText(content, true);

			mailSender.send(message);
			log.info("[SendMail] 메일 발송 성공 -> {}", toEmail);
			return true;

		} catch (Exception e) {
			log.error("[SendMail] 메일 발송 실패: {}", e.getMessage(), e);
			return false;
		}
	}
}
