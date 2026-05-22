package com.madraza.repository;

import com.madraza.entity.AsignacionTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignacionTestRepository extends JpaRepository<AsignacionTest, Long> {

    List<AsignacionTest> findByOrganizacionIdAndActivaTrue(Long organizacionId);

    long countByTestIdAndActivaTrue(Long testId);

    long countByApunteIdAndActivaTrue(Long apunteId);

    void deleteByTestId(Long testId);
}
