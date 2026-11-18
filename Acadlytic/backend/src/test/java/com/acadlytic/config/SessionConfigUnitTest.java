package com.acadlytic.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.session.web.http.CookieSerializer;

import static org.assertj.core.api.Assertions.assertThat;

class SessionConfigUnitTest {

    @Test
    void prodCookieSerializerStrictlySatisfiesHostPrefixSpecification() {
        SecurityProperties props = new SecurityProperties();
        props.getCookie().setName("__Host-ACADLYTIC_SID");
        props.getCookie().setSecure(true);
        props.getCookie().setSameSite("Lax");
        props.getCookie().setPath("/");

        SessionConfig config = new SessionConfig();
        CookieSerializer serializer = config.cookieSerializer(props);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        serializer.writeCookieValue(new CookieSerializer.CookieValue(request, response, "test-session-id"));

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).startsWith("__Host-ACADLYTIC_SID=test-session-id");
        assertThat(setCookieHeader).contains("Path=/");
        assertThat(setCookieHeader).contains("Secure");
        assertThat(setCookieHeader).contains("HttpOnly");
        assertThat(setCookieHeader).contains("SameSite=Lax");
        assertThat(setCookieHeader).doesNotContain("Domain=");
        assertThat(setCookieHeader).doesNotContain("Max-Age=");
    }

    @Test
    void devCookieSerializerUsesAcadlyticSidWithHttpOnlyAndLax() {
        SecurityProperties props = new SecurityProperties();
        props.getCookie().setName("ACADLYTIC_SID");
        props.getCookie().setSecure(false);
        props.getCookie().setSameSite("Lax");
        props.getCookie().setPath("/");

        SessionConfig config = new SessionConfig();
        CookieSerializer serializer = config.cookieSerializer(props);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        serializer.writeCookieValue(new CookieSerializer.CookieValue(request, response, "dev-session-id"));

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).startsWith("ACADLYTIC_SID=dev-session-id");
        assertThat(setCookieHeader).contains("Path=/");
        assertThat(setCookieHeader).contains("HttpOnly");
        assertThat(setCookieHeader).contains("SameSite=Lax");
        assertThat(setCookieHeader).doesNotContain("Secure");
        assertThat(setCookieHeader).doesNotContain("Domain=");
        assertThat(setCookieHeader).doesNotContain("Max-Age=");
    }
}
