package com.acadlytic;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AcadlyticApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring ApplicationContext loads without error
    }
}
