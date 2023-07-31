define([],

function() {
	function getDictionayFields(){
		return {
			equipo:{
				1:'custrecord_c_pre_odv_equipo',
				2:'custrecord_c_gtm_odv_equipo',
				3:'custrecord_c_jdg_odv_equipo',
			},
			rec:{
				1:'custrecord_c_gtm_pre_rec',
				2:'custrecord_c_gtm_odv_rec',
				3:'custrecord_c_jdg_odv_rec',
			},
			total:{
				1:'custrecord_c_pre_subtotal',
				2:'custrecord_c_gtm_subtotal',
				3:'custrecord_c_jdg_subtotal',
			},
			productividad:{
				1:'custrecord_c_pre_monto_bono_pr',
				2:'custrecord_c_gtm_monto_bono_pr',
				3:'custrecord_c_jdg_monto_bono_propio',
			},
			venta_propia:{
				1:'custrecord_c_pre_compensacion',
				2:'custrecord_c_gtm_compensacion_propio',
				3:'custrecord_c_jdg_compensacion_propio',
			},
			comision_equipo:{
				1:'',
				2:'',
				3:'custrecord_c_jdg_total_comisiones_equipo',
			},
			entrega_monto:{
				1:'custrecord_c_pre_bono_manual2',
				2:'custrecord_c_gtm_bono_manual2',
				3:'custrecord_c_jdg_bono_manual2',
			},
			entregas:{
				1:'custrecord_c_pre_entregas',
				2:'custrecord_c_gtm_entregas',
				3:'custrecord_c_jdg_entregas',
			},
			b_rec:{
				1:'custrecord_c_pre_bono_rec',
				2:'custrecord_c_gtm_bono_rec',
				3:'custrecord_c_jdg_bono_rec',
			},
			bono_1:{
				1:'custrecord_c_pre_bono_uno',
				2:'custrecord_c_gtm_bono1',
				3:'custrecord_c_jdg_bono1',
			},
			bono_2:{
				1:'custrecord_c_pre_bono2',
				2:'custrecord_c_gtm_bono2',
				3:'custrecord_c_jdg_bono2',
			},
			bono_3:{
				1:'custrecord_c_pre_bono3',
				2:'custrecord_c_gtm_bono3',
				3:'custrecord_c_jdg_bono3',
			},
			bono_4:{
				1:'custrecord_c_pre_bono4',
				2:'custrecord_c_gtm_bono4',
				3:'custrecord_c_jdg_bono4',
			},
			bono_5:{
				1:'custrecord_c_pre_bono5',
				2:'custrecord_c_gtm_bono5',
				3:'custrecord_c_jdg_bono5',
			},
			bono_6:{
				1:'custrecord_c_pre_bono6',
				2:'custrecord_c_gtm_bono6',
				3:'custrecord_c_jdg_bono6',
			},
			bono_7:{
				1:'custrecord_c_pre_bono7',
				2:'custrecord_c_gtm_bono7',
				3:'custrecord_c_jdg_bono7',
			},
			bono_8:{
				1:'custrecord_c_pre_bono8',
				2:'custrecord_c_gtm_bono8',
				3:'custrecord_c_jdg_bono8',
			},
			bono_9:{
				1:'custrecord_c_pre_bono9',
				2:'custrecord_c_gtm_bono9',
				3:'custrecord_c_jdg_bono9',
			},
			bono_10:{
				1:'custrecord_c_pre_bono10',
				2:'custrecord_c_gtm_bono10',
				3:'custrecord_c_jdg_bono10',
			},
			bono_m_1:{
				1:'custrecord_c_pre_bono_manual1',
				2:'custrecord_c_gtm_bono_manual1',
				3:'custrecord_c_jdg_bono_manual1',
			},
			bono_m_2:{
				1:'custrecord_c_pre_bono_manual2',
				2:'custrecord_c_gtm_bono_manual2',
				3:'custrecord_c_jdg_bono_manual2',
			},
			bono_m_3:{
				1:'custrecord_c_pre_bono_manual3',
				2:'custrecord_c_gtm_bono_manual3',
				3:'custrecord_c_jdg_bono_manual3',
			},
			bono_m_4:{
				1:'custrecord_c_pre_bono_manual4',
				2:'custrecord_c_gtm_bono_manual4',
				3:'custrecord_c_jdg_bono_manual4',
			},
			bono_m_5:{
				1:'custrecord_c_pre_bono_manual5',
				2:'custrecord_c_gtm_bono_manual5',
				3:'custrecord_c_jdg_bono_manual5',
			},
			bono_m_6:{
				1:'custrecord_c_pre_bono_manual6',
				2:'custrecord_c_gtm_bono_manual6',
				3:'custrecord_c_jdg_bono_manual6',
			},
			bono_m_7:{
				1:'custrecord_c_pre_bono_manual7',
				2:'custrecord_c_gtm_bono_manual7',
				3:'custrecord_c_jdg_bono_manual7',
			},
			bono_m_8:{
				1:'custrecord_c_pre_bono_manual8',
				2:'custrecord_c_gtm_bono_manual8',
				3:'custrecord_c_jdg_bono_manual8',
			},
			bono_m_9:{
				1:'custrecord_c_pre_bono_manual9',
				2:'custrecord_c_gtm_bono_manual9',
				3:'custrecord_c_jdg_bono_manual9',
			},
			bono_m_10:{
				1:'custrecord_c_pre_bono_manual10',
				2:'custrecord_c_gtm_bono_manual10',
				3:'custrecord_c_jdg_bono_manual10',
			},
			retencion:{
				1:'custrecord_c_pre_retencion',
				2:'custrecord_c_gtm_retencion',
				3:'custrecord_c_jdg_retencion',
			},
			odv_entrega:{
				1:'custrecord_c_pre_odv_entrega',
				2:'custrecord_c_gtm_odv_entrega',
				3:'custrecord_c_jdg_odv_entrega',
			},
			emleado:{
				1:'custrecord_c_pre_empleado',
				2:'custrecord_c_gtm_empleado',
				3:'custrecord_c_jdg_empleado',
			},
			nom_unidad:{
				1:'custrecord_c_pre_nombre_unidad',
				2:'custrecord_c_gtm_nombre_unidad',
				3:'custrecord_c_jdg_nombre_unidad',
			},
			no_v_propio:{
				1:'custrecord_c_pre_ventas_propio',
				2:'custrecord_c_gtm_ventas_propio',
				3:'custrecord_c_jdg_ventas_propio',
			},
			monto_v_propio:{
				1:'custrecord_c_pre_monto_venta',
				2:'custrecord_c_gtm_monto_venta',
				3:'custrecord_c_jdg_monto_venta_propio',
			
			},
			customrecord:{
				1:'customrecord_comisiones_presentadora',
				2:'customrecord_compensaciones_gtm',
				3:'customrecord_compensaciones_jdg',
			
			},
			empleado:{
				1:'custrecord_c_pre_empleado',
				2:'custrecord_c_gtm_empleado',
				3:'custrecord_c_jdg_empleado',
			
			},
			_total:{
				1:'custrecord_c_pre_total',
				2:'custrecord_c_gtm_total',
				3:'custrecord_c_jdg_total',
			
			},
			ref:{
				1:'name',
				2:'name',
				3:'name',
			
			},
			registro_compensaciones:{
				1:'custrecord_sub_registro_compensaciones_p',
				2:'custrecord_sub_registro_compensaciones_g',
				3:'custrecord_sub__registro_compensaciones',
			
			},
			xml:{
				1:'custrecord_c_pre_xml_sat',
				2:'custrecord_c_jdg_gtm_sat',
				3:'custrecord_c_jdg_xml_sat',
			
			},
			pdf:{
				1:'custrecord_c_pre_pdf',
				2:'custrecord_c_gtm_pdf',
				3:'custrecord_c_jdg_pdg',
			
			},
			ajuste:{
				1:'custrecord_c_pre_ajuste',
				2:'custrecord_c_gtm_ajuste',
				3:'custrecord_c_jdg_ajuste',
			
			},
			garantia:{
				1:'custrecord_c_pre_garantia_ext',
				2:'custrecord_c_gtm_garantia_ext',
				3:'custrecord_c_jdg_garantia_ext'
			},
			ids_garantia:{
				1:'custrecord_c_pre_garantia_ext_id',
				2:'custrecord_c_gtm_garantia_ext_id',
				3:'custrecord_c_jdg_garantia_ext_id'
			},
			tres_dos:{
				1:'custrecord_vw_odv_recluta_tres_dos',
				2:'custrecord_vw_odv_recluta_tres_dos',
				3:'custrecord_vw_odv_recluta_tres_dos'
			},
			rec_period_LE:{//RECLUTAS Y ODV POR RECLUTA DEL LE DEL PERIODO
				1:'custrecord_rec_de_le_period',
				2:'custrecord_rec_de_le_period',
				3:'custrecord_rec_de_le_period'
			},
			sc:{//ODV POR RECLUTA DEL MES DEL EQUIPO SC
				1:'custrecord_rec_equipo_90',
				2:'custrecord_rec_equipo_90',
				3:'custrecord_rec_equipo_90'
			}
		} 
	}
    return {
        getDictionayFields: getDictionayFields
    };
    
});
