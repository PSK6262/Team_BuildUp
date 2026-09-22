package com.app.util;

import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@PropertySource(value = "classpath:config/smtp.properties", ignoreResourceNotFound = true)
@SuppressWarnings("null")
public class SendMail {

	@Autowired(required = false)
	private JavaMailSender mailSender;

	@Value("${mail.username:}")
	private String fromEmail;

	@SuppressWarnings("null")
	public boolean send(String toEmail, String title, String content) {
		try {
			if (mailSender == null) {
				log.warn("[SendMail] JavaMailSender가 설정되지 않아 메일 발송을 건너뜁니다.");
				return false;
			}

			if (toEmail == null || title == null || content == null) {
				log.warn("[SendMail] 필수 메일 정보(수신자/제목/내용)가 누락되었습니다.");
				return false;
			}

			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

			String sender = StringUtils.hasText(fromEmail) ? fromEmail : "noreply@buildup.com";
			helper.setFrom(sender, "PL:UG");
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
